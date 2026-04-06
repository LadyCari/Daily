import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StorageService } from './storage.service';
import { CustomForm, CustomFormField, CustomFormItem, CustomFormFieldType } from '../interfaces/custom-form.interface';

const STORAGE_KEY = 'custom-forms-v1';

@Injectable({ providedIn: 'root' })
export class CustomFormsService {
  readonly imported$ = new Subject<void>();

  constructor(private storage: StorageService) { }

  async loadAll(): Promise<CustomForm[]> {
    return (await this.storage.get(STORAGE_KEY)) as CustomForm[] ?? [];
  }

  async saveAll(forms: CustomForm[]): Promise<void> {
    await this.storage.set(STORAGE_KEY, forms);
  }

  async getById(id: string): Promise<CustomForm | undefined> {
    const forms = await this.loadAll();
    return forms.find(f => f.id === id);
  }

  async createForm(title: string): Promise<CustomForm> {
    const forms = await this.loadAll();
    const now = new Date().toISOString();
    const form: CustomForm = {
      id: this.newId(),
      title: title.trim(),
      createdAt: now,
      updatedAt: now,
      fields: [],
      items: []
    };
    forms.unshift(form);
    await this.saveAll(forms);
    return form;
  }

  async updateForm(form: CustomForm): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === form.id);
    if (idx === -1) return;
    forms[idx] = { ...form, updatedAt: new Date().toISOString() };
    await this.saveAll(forms);
  }

  async deleteForm(id: string): Promise<void> {
    const forms = await this.loadAll();
    await this.saveAll(forms.filter(f => f.id !== id));
  }

  async reorderForms(ordered: CustomForm[]): Promise<void> {
    await this.saveAll(ordered);
  }

  async reorderFields(formId: string, fields: CustomFormField[]): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;
    forms[idx] = { ...forms[idx], fields, updatedAt: new Date().toISOString() };
    await this.saveAll(forms);
  }

  async addField(formId: string, field: Omit<CustomFormField, 'id'>): Promise<CustomFormField | undefined> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const newField: CustomFormField = {
      id: this.newId(),
      label: field.label.trim(),
      type: field.type,
      required: !!field.required,
      options: field.options
    };

    forms[idx] = {
      ...forms[idx],
      updatedAt: new Date().toISOString(),
      fields: [...forms[idx].fields, newField]
    };

    await this.saveAll(forms);
    return newField;
  }

  async updateField(formId: string, field: CustomFormField): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const fields = forms[idx].fields.map(f => (f.id === field.id ? { ...field, label: field.label.trim() } : f));
    forms[idx] = { ...forms[idx], updatedAt: new Date().toISOString(), fields };
    await this.saveAll(forms);
  }

  async deleteField(formId: string, fieldId: string): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const fields = forms[idx].fields.filter(f => f.id !== fieldId);
    forms[idx] = { ...forms[idx], updatedAt: new Date().toISOString(), fields };
    await this.saveAll(forms);
  }

  async addItem(formId: string, values: Record<string, any>, syncMeta?: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<CustomFormItem | undefined> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const item: CustomFormItem = {
      id: this.newId(),
      createdAt: new Date().toISOString(),
      values,
      ...(syncMeta ?? {})
    };

    forms[idx] = {
      ...forms[idx],
      updatedAt: new Date().toISOString(),
      items: [item, ...forms[idx].items]
    };

    await this.saveAll(forms);
    return item;
  }

  async updateItem(formId: string, item: CustomFormItem, syncMeta?: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const updatedItem = syncMeta ? { ...item, ...syncMeta } : item;
    const items = forms[idx].items.map(i => (i.id === item.id ? updatedItem : i));
    forms[idx] = { ...forms[idx], updatedAt: new Date().toISOString(), items };
    await this.saveAll(forms);
  }

  async deleteItem(formId: string, itemId: string): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const items = forms[idx].items.filter(i => i.id !== itemId);
    forms[idx] = { ...forms[idx], updatedAt: new Date().toISOString(), items };
    await this.saveAll(forms);
  }

  /** Soft delete: marca el ítem como eliminado sin borrarlo (necesario para sync) */
  async softDeleteItem(formId: string, itemId: string, syncMeta: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;

    const items = forms[idx].items.map(i =>
      i.id === itemId ? { ...i, deleted: true, ...syncMeta } : i
    );
    forms[idx] = { ...forms[idx], updatedAt: new Date().toISOString(), items };
    await this.saveAll(forms);
  }

  // ── Exportar ────────────────────────────────────────
  async exportFormData(id: string): Promise<{ filename: string; json: string }> {
    const form = await this.getById(id);
    if (!form) throw new Error('Form no encontrado');
    const json = JSON.stringify({ v: 1, form }, null, 2);
    const filename = `form-${form.title.replace(/\s+/g, '_')}.json`;
    return { filename, json };
  }

  // ── Importar ────────────────────────────────────────
  async importFormFromJson(json: string): Promise<void> {
    const payload = JSON.parse(json);
    if (!payload?.form?.title) throw new Error('Archivo inválido');
    const source: CustomForm = payload.form;
    const forms = await this.loadAll();
    const newForm: CustomForm = {
      id: this.newId(),
      title: source.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: source.fields.map(f => ({ ...f, id: this.newId() })),
      items: source.items.map(i => ({ ...i, id: this.newId() }))
    };
    forms.unshift(newForm);
    await this.saveAll(forms);
    this.imported$.next();
  }

  normalizeFieldForEdit(field: CustomFormField): CustomFormField {
    const options = field.type === 'select' ? (field.options ?? []) : undefined;
    return { ...field, options };
  }

  normalizeFieldForSave(field: CustomFormField): CustomFormField {
    const base: CustomFormField = {
      id: field.id,
      label: field.label.trim(),
      type: field.type,
      required: !!field.required
    };

    if (field.type === 'select') {
      return {
        ...base,
        options: (field.options ?? []).map(o => (o ?? '').trim()).filter(Boolean)
      };
    }

    return base;
  }

  getDefaultValueForType(type: CustomFormFieldType): any {
    switch (type) {
      case 'checkbox':
        return false;
      default:
        return '';
    }
  }

  /** Marca un form existente como vinculado a un grupo */
  async setLinkedRef(formId: string, linkedRef: { groupId: string; firestoreKey: string }): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;
    forms[idx] = { ...forms[idx], linkedRef };
    await this.saveAll(forms);
  }

  /** Elimina el linkedRef de un form (desvincular) */
  async clearLinkedRef(formId: string): Promise<void> {
    const forms = await this.loadAll();
    const idx = forms.findIndex(f => f.id === formId);
    if (idx === -1) return;
    const { linkedRef: _, ...rest } = forms[idx];
    forms[idx] = rest as CustomForm;
    await this.saveAll(forms);
  }

  /** Agrega un form completo directamente (usado al recibir form vinculado de otro) */
  async addFormDirecta(form: CustomForm): Promise<void> {
    const forms = await this.loadAll();
    forms.unshift(form);
    await this.saveAll(forms);
    this.imported$.next();
  }

  private newId(): string {
    return Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
  }
}
