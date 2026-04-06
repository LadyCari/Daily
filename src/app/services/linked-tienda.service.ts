import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { TarjetaTienda } from './tarjeta-tienda.service';
import { Producto } from './producto.service';
import { GroupService } from './group.service';
import { TarjetaComprasModel } from '../interfaces/tarjeta-compras.interface';
import { ProductoModel } from '../interfaces/producto.interface';

export interface LinkedTiendaDoc {
  firestoreKey: string;
  groupId: string;
  ownerUid: string;
  ownerName: string;
  tienda: Omit<TarjetaComprasModel, 'linkedRef'>;
  items: Record<string, ProductoModel>;
  lastUpdated: number;
}

@Injectable({ providedIn: 'root' })
export class LinkedTiendaService {

  private fs         = inject(FirestoreService);
  private auth       = inject(AuthService);
  private tiendaSvc  = inject(TarjetaTienda);
  private productoSvc = inject(Producto);
  private groupSvc   = inject(GroupService);

  private key(groupId: string, ownerUid: string, tiendaId: string): string {
    return `${groupId}_${ownerUid}_${tiendaId}`;
  }

  // ── COMPARTIR ──────────────────────────────────────────────────────────────

  /**
   * Vincula una tienda local a un grupo en Firestore.
   * Sube los productos actuales con timestamp del momento.
   */
  async shareTienda(tiendaId: string, groupId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const tienda = await this.tiendaSvc.getTarjetaById(tiendaId);
    if (!tienda) throw new Error('Tienda no encontrada');

    // Limpiar docs huérfanos de este usuario en este grupo antes de crear uno nuevo
    await this.cleanOrphanedDocs(groupId, user.uid);

    const allProductos = await this.productoSvc.loadAllProduct();
    const productos = allProductos.filter(p => p.idTarjetaCompras === tiendaId);

    const now = Date.now();
    const itemsMap: Record<string, ProductoModel> = {};
    for (const p of productos) {
      itemsMap[p.id] = { ...p, updatedAt: now, updatedByUid: user.uid, updatedByName: user.name };
    }

    const firestoreKey = this.key(groupId, user.uid, tiendaId);

    const doc: LinkedTiendaDoc = {
      firestoreKey,
      groupId,
      ownerUid:    user.uid,
      ownerName:   user.name,
      tienda:      { id: tienda.id, name: tienda.name, categoria: tienda.categoria, accentColor: tienda.accentColor, iconColor: tienda.iconColor, textColor: tienda.textColor },
      items:       itemsMap,
      lastUpdated: now,
    };

    await this.fs.setDocFull(`linkedTiendas/${firestoreKey}`, doc);

    // Marcar tienda local como vinculada
    await this.tiendaSvc.setLinkedRef(tiendaId, { groupId, firestoreKey });

    // Actualizar timestamps en productos locales
    const productosConTs = productos.map(p => ({ ...p, updatedAt: now, updatedByUid: user.uid, updatedByName: user.name }));
    await this.productoSvc.replaceProductosForTienda(tiendaId, productosConTs);
  }

  // ── DESVINCULAR ────────────────────────────────────────────────────────────

  /** Elimina el doc de Firestore y quita el linkedRef local */
  async desvincularTienda(tiendaId: string): Promise<void> {
    const tienda = await this.tiendaSvc.getTarjetaById(tiendaId);
    if (!tienda?.linkedRef) return;
    await this.fs.deleteDoc(`linkedTiendas/${tienda.linkedRef.firestoreKey}`);
    await this.tiendaSvc.clearLinkedRef(tiendaId);
  }

  /**
   * Elimina docs de Firestore de este usuario en este grupo
   * que ya no corresponden a ninguna tienda local vinculada.
   */
  private async cleanOrphanedDocs(groupId: string, ownerUid: string): Promise<void> {
    try {
      const docs = await this.fs.queryWhere<LinkedTiendaDoc>('linkedTiendas', 'ownerUid', '==', ownerUid);
      const docsDelGrupo = docs.filter(d => d.groupId === groupId);
      if (!docsDelGrupo.length) return;

      const tiendas = await this.tiendaSvc.loadAllTarjetas();
      const linkedKeys = new Set(tiendas.map(t => t.linkedRef?.firestoreKey).filter(Boolean));

      for (const doc of docsDelGrupo) {
        if (!linkedKeys.has(doc.firestoreKey)) {
          await this.fs.deleteDoc(`linkedTiendas/${doc.firestoreKey}`);
        }
      }
    } catch { /* no interrumpir el flujo principal */ }
  }

  // ── SYNC ───────────────────────────────────────────────────────────────────

  /**
   * Sincroniza una tienda vinculada:
   * - Sube los items locales más nuevos
   * - Baja los items de Firestore más nuevos
   * - Items nuevos de cualquier lado se agregan
   * Ganador: mayor updatedAt por item.
   */
  async syncLinkedTienda(tiendaId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const tienda = await this.tiendaSvc.getTarjetaById(tiendaId);
    if (!tienda?.linkedRef) throw new Error('La tienda no está vinculada');

    const { firestoreKey } = tienda.linkedRef;

    const remoteDoc = await this.fs.getDoc<LinkedTiendaDoc>(`linkedTiendas/${firestoreKey}`);
    if (!remoteDoc) throw new Error('Documento remoto no encontrado. Pedile al dueño que sincronice primero.');

    const allLocal = await this.productoSvc.loadAllProduct();
    const localProductos = allLocal.filter(p => p.idTarjetaCompras === tiendaId);
    const now = Date.now();

    // Construir mapa local con timestamps
    const localMap: Record<string, ProductoModel> = {};
    for (const p of localProductos) {
      localMap[p.id] = { ...p, updatedAt: p.updatedAt ?? now, updatedByUid: p.updatedByUid ?? user.uid, updatedByName: p.updatedByName ?? user.name };
    }

    const remoteMap: Record<string, ProductoModel> = remoteDoc.items ?? {};

    // Merge: gana el más nuevo por item
    const mergedMap: Record<string, ProductoModel> = { ...remoteMap };

    for (const [id, localItem] of Object.entries(localMap)) {
      const remoteItem = remoteMap[id];
      if (!remoteItem) {
        // Item nuevo local → agregar al merge
        mergedMap[id] = localItem;
      } else if ((localItem.updatedAt ?? 0) >= (remoteItem.updatedAt ?? 0)) {
        // Local más nuevo o igual → local gana
        mergedMap[id] = localItem;
      }
      // else: remoteItem ya está en mergedMap y es más nuevo
    }

    // Guardar merged en Firestore
    const updatedDoc: LinkedTiendaDoc = {
      ...remoteDoc,
      items:       mergedMap,
      lastUpdated: now,
    };
    await this.fs.setDocFull(`linkedTiendas/${firestoreKey}`, updatedDoc);

    // Guardar merged localmente
    const mergedList = Object.values(mergedMap).map(p => ({
      ...p,
      idTarjetaCompras: tiendaId, // asegurar que la referencia local es correcta
    }));
    await this.productoSvc.replaceProductosForTienda(tiendaId, mergedList);
  }

  // ── RECIBIR ────────────────────────────────────────────────────────────────

  /**
   * Busca tiendas vinculadas en el grupo que el usuario NO tiene localmente
   * y las agrega a su storage local.
   */
  async receiveTiendasFromGroup(groupId: string): Promise<number> {
    const user = this.auth.user();
    if (!user) return 0;

    const docs = await this.fs.queryWhere<LinkedTiendaDoc>('linkedTiendas', 'groupId', '==', groupId);
    const docsDeOtros = docs.filter(d => d.ownerUid !== user.uid);

    const tiendas = await this.tiendaSvc.loadAllTarjetas();
    let added = 0;

    for (const doc of docsDeOtros) {
      const yaExiste = tiendas.some(t => t.linkedRef?.firestoreKey === doc.firestoreKey);
      if (yaExiste) continue;

      // Crear tienda local nueva
      const newId = `linked_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newTienda: TarjetaComprasModel = {
        ...doc.tienda,
        id:        newId,
        linkedRef: { groupId, firestoreKey: doc.firestoreKey },
      };
      await this.tiendaSvc.addTiendaDirecta(newTienda);

      // Crear productos locales
      const productos = Object.values(doc.items).map(p => ({
        ...p,
        idTarjetaCompras: newId,
      }));
      await this.productoSvc.replaceProductosForTienda(newId, productos);
      added++;
    }

    return added;
  }

  /** Sync de todas las tiendas vinculadas del usuario. Devuelve la cantidad de errores. */
  async syncAllLinked(): Promise<number> {
    const tiendas = await this.tiendaSvc.loadAllTarjetas();
    const vinculadas = tiendas.filter(t => !!t.linkedRef);
    let errors = 0;
    for (const t of vinculadas) {
      try {
        await this.syncLinkedTienda(t.id);
      } catch {
        errors++;
      }
    }
    return errors;
  }

  /** Recibe tiendas de todos los grupos del usuario */
  async receiveFromAllGroups(): Promise<void> {
    const grupos = await this.groupSvc.getMyGroups();
    for (const g of grupos) {
      await this.receiveTiendasFromGroup(g.id);
    }
  }
}
