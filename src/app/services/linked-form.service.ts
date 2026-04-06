import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { CustomFormsService } from './custom-forms.service';
import { GroupService } from './group.service';
import { CustomForm, CustomFormItem } from '../interfaces/custom-form.interface';

export interface LinkedFormDoc {
  firestoreKey: string;
  groupId: string;
  ownerUid: string;
  ownerName: string;
  /** Definición del form (campos, título) — solo el dueño la actualiza */
  formMeta: Pick<CustomForm, 'id' | 'title' | 'fields' | 'createdAt'>;
  /** Items indexados por id para merge por timestamp */
  items: Record<string, CustomFormItem>;
  lastUpdated: number;
}

@Injectable({ providedIn: 'root' })
export class LinkedFormService {

  private fs        = inject(FirestoreService);
  private auth      = inject(AuthService);
  private formsSvc  = inject(CustomFormsService);
  private groupSvc  = inject(GroupService);

  private key(groupId: string, ownerUid: string, formId: string): string {
    return `${groupId}_${ownerUid}_${formId}`;
  }

  // ── COMPARTIR ──────────────────────────────────────────────────────────────

  /** Vincula un form local a un grupo en Firestore */
  async shareForm(formId: string, groupId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const form = await this.formsSvc.getById(formId);
    if (!form) throw new Error('Formulario no encontrado');

    // Limpiar docs huérfanos de este usuario en este grupo antes de crear uno nuevo
    await this.cleanOrphanedDocs(groupId, user.uid);

    const now = Date.now();
    const itemsMap: Record<string, CustomFormItem> = {};
    for (const item of form.items) {
      itemsMap[item.id] = { ...item, updatedAt: now, updatedByUid: user.uid, updatedByName: user.name };
    }

    const firestoreKey = this.key(groupId, user.uid, formId);
    const doc: LinkedFormDoc = {
      firestoreKey,
      groupId,
      ownerUid:  user.uid,
      ownerName: user.name,
      formMeta:  { id: form.id, title: form.title, fields: form.fields, createdAt: form.createdAt },
      items:     itemsMap,
      lastUpdated: now,
    };

    await this.fs.setDocFull(`linkedForms/${firestoreKey}`, doc);

    // Guardar linkedRef + timestamps en un solo updateForm (setLinkedRef separado sobreescribiría)
    const updatedForm = { ...form, linkedRef: { groupId, firestoreKey }, items: Object.values(itemsMap) };
    await this.formsSvc.updateForm(updatedForm);
  }

  // ── DESVINCULAR ────────────────────────────────────────────────────────────

  /** Elimina el doc de Firestore y quita el linkedRef local */
  async desvincularForm(formId: string): Promise<void> {
    const form = await this.formsSvc.getById(formId);
    if (!form?.linkedRef) return;
    await this.fs.deleteDoc(`linkedForms/${form.linkedRef.firestoreKey}`);
    await this.formsSvc.clearLinkedRef(formId);
  }

  /**
   * Elimina docs de Firestore de este usuario en este grupo
   * que ya no corresponden a ningún form local vinculado.
   */
  private async cleanOrphanedDocs(groupId: string, ownerUid: string): Promise<void> {
    try {
      const docs = await this.fs.queryWhere<LinkedFormDoc>('linkedForms', 'ownerUid', '==', ownerUid);
      const docsDelGrupo = docs.filter(d => d.groupId === groupId);
      if (!docsDelGrupo.length) return;

      const forms = await this.formsSvc.loadAll();
      const linkedKeys = new Set(forms.map(f => f.linkedRef?.firestoreKey).filter(Boolean));

      for (const doc of docsDelGrupo) {
        if (!linkedKeys.has(doc.firestoreKey)) {
          await this.fs.deleteDoc(`linkedForms/${doc.firestoreKey}`);
        }
      }
    } catch { /* no interrumpir el flujo principal */ }
  }

  // ── SYNC ───────────────────────────────────────────────────────────────────

  /**
   * Merge por item (gana el updatedAt más nuevo).
   * Items nuevos de cualquier lado se agregan.
   */
  async syncLinkedForm(formId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const form = await this.formsSvc.getById(formId);
    if (!form?.linkedRef) throw new Error('El formulario no está vinculado');

    const { firestoreKey } = form.linkedRef;
    const remoteDoc = await this.fs.getDoc<LinkedFormDoc>(`linkedForms/${firestoreKey}`);
    if (!remoteDoc) throw new Error('Documento remoto no encontrado.');

    const now = Date.now();

    // Mapa local con timestamps
    const localMap: Record<string, CustomFormItem> = {};
    for (const item of form.items) {
      localMap[item.id] = { ...item, updatedAt: item.updatedAt ?? now, updatedByUid: item.updatedByUid ?? user.uid, updatedByName: item.updatedByName ?? user.name };
    }

    const remoteMap: Record<string, CustomFormItem> = remoteDoc.items ?? {};

    // Merge: gana el más nuevo por item
    const mergedMap: Record<string, CustomFormItem> = { ...remoteMap };
    for (const [id, localItem] of Object.entries(localMap)) {
      const remoteItem = remoteMap[id];
      if (!remoteItem || (localItem.updatedAt ?? 0) >= (remoteItem.updatedAt ?? 0)) {
        mergedMap[id] = localItem;
      }
    }

    // Si soy el dueño, también actualizo la meta del form (campos)
    const updatedDoc: LinkedFormDoc = {
      ...remoteDoc,
      items:       mergedMap,
      lastUpdated: now,
      ...(user.uid === remoteDoc.ownerUid
        ? { formMeta: { id: form.id, title: form.title, fields: form.fields, createdAt: form.createdAt } }
        : {}),
    };
    await this.fs.setDocFull(`linkedForms/${firestoreKey}`, updatedDoc);

    // Guardar merged localmente
    const updatedForm: CustomForm = {
      ...form,
      // Si NO soy el dueño, actualizar campos desde remoto
      fields: user.uid !== remoteDoc.ownerUid ? remoteDoc.formMeta.fields : form.fields,
      items:  Object.values(mergedMap),
      updatedAt: new Date(now).toISOString(),
    };
    await this.formsSvc.updateForm(updatedForm);
  }

  // ── RECIBIR ────────────────────────────────────────────────────────────────

  /** Agrega localmente forms vinculados de otros miembros del grupo */
  async receiveFormsFromGroup(groupId: string): Promise<number> {
    const user = this.auth.user();
    if (!user) return 0;

    const docs = await this.fs.queryWhere<LinkedFormDoc>('linkedForms', 'groupId', '==', groupId);
    const docsDeOtros = docs.filter(d => d.ownerUid !== user.uid);

    const forms = await this.formsSvc.loadAll();
    let added = 0;

    for (const doc of docsDeOtros) {
      const yaExiste = forms.some(f => f.linkedRef?.firestoreKey === doc.firestoreKey);
      if (yaExiste) continue;

      const now = new Date().toISOString();
      const newForm: CustomForm = {
        id:         `linked_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title:      doc.formMeta.title,
        createdAt:  doc.formMeta.createdAt,
        updatedAt:  now,
        fields:     doc.formMeta.fields,
        items:      Object.values(doc.items),
        linkedRef:  { groupId, firestoreKey: doc.firestoreKey },
      };
      await this.formsSvc.addFormDirecta(newForm);
      added++;
    }

    return added;
  }

  /** Sync de todos los forms vinculados. Devuelve la cantidad de errores. */
  async syncAllLinked(): Promise<number> {
    const forms = await this.formsSvc.loadAll();
    const vinculados = forms.filter(f => !!f.linkedRef);
    let errors = 0;
    for (const f of vinculados) {
      try {
        await this.syncLinkedForm(f.id);
      } catch {
        errors++;
      }
    }
    return errors;
  }

  /** Recibe forms de todos los grupos */
  async receiveFromAllGroups(): Promise<void> {
    const grupos = await this.groupSvc.getMyGroups();
    for (const g of grupos) {
      await this.receiveFormsFromGroup(g.id);
    }
  }
}
