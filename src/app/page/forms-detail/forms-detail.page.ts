import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ModalController, ToastController, ActionSheetController } from '@ionic/angular';
import { HeaderComponent } from '../header/header.page';
import { CustomFormsService } from 'src/app/services/custom-forms.service';
import { CustomForm, CustomFormField, CustomFormItem } from 'src/app/interfaces/custom-form.interface';
import { CustomFormItemModalComponent } from 'src/app/modal/custom-form-item/custom-form-item.component';
import { LinkedFormService } from 'src/app/services/linked-form.service';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-forms-detail',
  templateUrl: './forms-detail.page.html',
  styleUrls: ['./forms-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class FormsDetailPage {
  form?: CustomForm;
  checkboxFields: CustomFormField[] = [];
  itemLinesMap = new Map<string, { label: string; value: string; isLink: boolean }[]>();
  private isOpeningModal = false;

  busqueda = '';
  sortFieldId: string | null = null;
  sortAsc = true;

  get sortableFields(): CustomFormField[] {
    return this.form?.fields.filter(f => f.type !== 'checkbox') ?? [];
  }

  get itemsVisible(): CustomFormItem[] {
    const items = (this.form?.items ?? []).filter(i => !i.deleted);
    const q = this.busqueda.trim().toLowerCase();

    let filtered = q
      ? items.filter(item =>
          Object.values(item.values ?? {}).some(v =>
            v != null && v.toString().toLowerCase().includes(q)
          )
        )
      : items;

    if (this.sortFieldId) {
      const fid = this.sortFieldId;
      const asc = this.sortAsc;
      filtered = [...filtered].sort((a, b) => {
        const va = (a.values?.[fid] ?? '').toString().toLowerCase();
        const vb = (b.values?.[fid] ?? '').toString().toLowerCase();
        const n = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? n : -n;
      });
    }

    return filtered;
  }

  setSort(fieldId: string) {
    if (this.sortFieldId === fieldId) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortFieldId = fieldId;
      this.sortAsc = true;
    }
  }

  get isLinked(): boolean { return !!this.form?.linkedRef; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customForms: CustomFormsService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private linkedFormSvc: LinkedFormService,
    public  authSvc: AuthService,
    private groupSvc: GroupService,
  ) { }

  async ionViewWillEnter() {
    await this.load();
  }

  goBack() {
    this.router.navigate(['/forms']);
  }

  private async load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/extra']);
      return;
    }
    this.form = await this.customForms.getById(id);
    if (!this.form) {
      this.router.navigate(['/forms']);
      return;
    }
    this.checkboxFields = this.form.fields.filter(f => f.type === 'checkbox');
    this.itemLinesMap = new Map(
      this.form.items.map(item => [item.id, this.calcItemLines(item)])
    );
  }

  async renameForm() {
    if (!this.form) return;

    const alert = await this.alertCtrl.create({
      header: 'Renombrar',
      inputs: [{ name: 'title', type: 'text', value: this.form.title, placeholder: 'Título' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data: any) => {
            const title = (data?.title ?? '').trim();
            if (!title) {
              const t = await this.toastCtrl.create({ message: 'Ingresá un título', duration: 1500, position: 'top' });
              await t.present();
              return false;
            }
            this.form = { ...this.form!, title };
            await this.customForms.updateForm(this.form);
            await this.load();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  configureFields() {
    if (!this.form) return;
    this.router.navigate(['/forms', this.form.id, 'fields']);
  }

  private applyModalStyles(modal: HTMLIonModalElement) {
    modal.style.setProperty('--modal-accent', 'var(--ion-color-neon, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'rgba(43, 248, 255, 0.22)');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-extra, #07070a)');
    modal.style.setProperty('--modal-glow', 'rgba(43, 248, 255, 0.15)');
    modal.style.setProperty('--modal-input-border', 'rgba(43, 248, 255, 0.22)');
    modal.style.setProperty('--modal-input-glow', 'rgba(43, 248, 255, 0.20)');
  }

  async addItem() {
    if (!this.form || this.isOpeningModal) return;
    this.isOpeningModal = true;

    if (this.form.fields.length === 0) {
      const t = await this.toastCtrl.create({ message: 'Agregá campos primero', duration: 1500, position: 'top' });
      await t.present();
      this.isOpeningModal = false;
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: CustomFormItemModalComponent,
        componentProps: {
          mode: 'create',
          title: this.form.title,
          fields: this.form.fields,
          initialValues: this.getInitialValuesForNewItem()
        },
        cssClass: 'themed-modal'
      });
      this.applyModalStyles(modal);
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (!data) return;
      const syncMeta = this.buildSyncMeta();
      await this.customForms.addItem(this.form.id, data.values, syncMeta);
      await this.load();
      this.autoPushLinked();
    } finally {
      this.isOpeningModal = false;
    }
  }

  async editItem(item: CustomFormItem) {
    if (!this.form || this.isOpeningModal) return;
    this.isOpeningModal = true;

    try {
      const modal = await this.modalCtrl.create({
        component: CustomFormItemModalComponent,
        componentProps: {
          mode: 'edit',
          title: this.form.title,
          fields: this.form.fields,
          initialValues: { ...(item.values ?? {}) }
        },
        cssClass: 'themed-modal'
      });
      this.applyModalStyles(modal);
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (!data) return;
      const syncMeta = this.buildSyncMeta();
      await this.customForms.updateItem(this.form.id, { ...item, values: data.values }, syncMeta);
      await this.load();
      this.autoPushLinked();
    } finally {
      this.isOpeningModal = false;
    }
  }

  async deleteItem(item: CustomFormItem) {
    if (!this.form) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar ítem',
      message: '¿Eliminar este ítem?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    if (this.isLinked) {
      const syncMeta = this.buildSyncMeta();
      if (syncMeta) {
        await this.customForms.softDeleteItem(this.form.id, item.id, syncMeta);
        this.autoPushLinked();
      }
    } else {
      await this.customForms.deleteItem(this.form.id, item.id);
    }
    await this.load();
  }

  private getInitialValuesForNewItem(): Record<string, any> {
    const values: Record<string, any> = {};
    for (const f of this.form?.fields ?? []) {
      values[f.id] = this.customForms.getDefaultValueForType(f.type);
      if (f.type === 'select') {
        values[f.id] = (f.options?.[0] ?? '') || '';
      }
    }
    return values;
  }

  trackByItemId(_: number, item: CustomFormItem): string {
    return item.id;
  }

  private calcItemLines(item: CustomFormItem): { label: string; value: string; isLink: boolean }[] {
    if (!this.form) return [];
    const lines: { label: string; value: string; isLink: boolean }[] = [];
    for (const f of this.form.fields) {
      if (f.type === 'checkbox') continue;
      const v = item.values?.[f.id];
      if (v === undefined || v === null || v === '') continue;
      const display = f.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? v.split('-').reverse().join('-')
        : v.toString();
      lines.push({ label: f.label, value: display, isLink: f.type === 'link' });
    }
    return lines;
  }

  openUrl(url: string, ev?: Event) {
    if (ev) ev.stopPropagation();
    let finalUrl = (url ?? '').trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank');
  }

  // ── Vincular con grupo ──────────────────────────────
  async vincularConGrupo() {
    if (!this.form) return;
    const user = this.authSvc.user();
    if (!user) {
      await this.toast('Necesitás iniciar sesión con Google primero', 'warning'); return;
    }
    const grupos = await this.groupSvc.getMyGroups();
    if (!grupos.length) {
      await this.toast('No tenés grupos. Creá uno primero en Perfil → Mis grupos', 'warning'); return;
    }
    const sheet = await this.actionSheetCtrl.create({
      header: 'Vincular con grupo',
      buttons: [
        ...grupos.map(g => ({
          text: g.name,
          handler: () => { this.confirmarVincular(g.id, g.name); }
        })),
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  private async confirmarVincular(groupId: string, groupName: string) {
    const alert = await this.alertCtrl.create({
      header: 'Vincular formulario',
      message: `¿Vincular "${this.form?.title}" con el grupo "${groupName}"? Los miembros podrán ver y editar los ítems cuando sincronicen.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Vincular', role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    try {
      await this.linkedFormSvc.shareForm(this.form!.id, groupId);
      await this.load();
      await this.toast('✅ Formulario vinculado. Sincronizá en el grupo para compartirlo.');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error'), 'danger');
    }
  }

  async syncLinked() {
    if (!this.form) return;
    try {
      await this.linkedFormSvc.syncLinkedForm(this.form.id);
      await this.load();
      await this.toast('✅ Sincronizado');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error al sincronizar'), 'danger');
    }
  }

  async desvincularForm() {
    if (!this.form) return;
    const alert = await this.alertCtrl.create({
      header: 'Desvincular formulario',
      message: '¿Desvincular este formulario del grupo? Los ítems quedarán en tu dispositivo pero dejarán de sincronizarse.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desvincular', role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    try {
      await this.linkedFormSvc.desvincularForm(this.form.id);
      await this.load();
      await this.toast('✅ Formulario desvinculado');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error al desvincular'), 'danger');
    }
  }

  /** Auto-push silencioso a Firestore cuando el form está vinculado */
  private autoPushLinked(): void {
    if (!this.isLinked || !this.form) return;
    this.linkedFormSvc.syncLinkedForm(this.form.id).catch(() => {});
  }

  private buildSyncMeta(): { updatedAt: number; updatedByUid: string; updatedByName: string } | undefined {
    if (!this.isLinked) return undefined;
    const user = this.authSvc.user();
    if (!user) return undefined;
    return { updatedAt: Date.now(), updatedByUid: user.uid, updatedByName: user.name };
  }

  private async toast(message: string, color = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2800, color });
    await t.present();
  }


  /** Returns true if at least one checkbox field exists and ALL of them are checked */
  isItemDone(item: CustomFormItem): boolean {
    if (this.checkboxFields.length === 0) return false;
    return this.checkboxFields.every(f => !!item.values?.[f.id]);
  }

  /** Toggle a checkbox field in the item and persist immediately */
  async toggleCheckbox(item: CustomFormItem, fieldId: string, event: Event) {
    event.stopPropagation();
    if (!this.form) return;
    const newVal = !item.values?.[fieldId];
    const updatedItem: CustomFormItem = {
      ...item,
      values: { ...(item.values ?? {}), [fieldId]: newVal }
    };
    // Optimistic update
    item.values = updatedItem.values;
    const syncMeta = this.buildSyncMeta();
    await this.customForms.updateItem(this.form.id, updatedItem, syncMeta);
    this.autoPushLinked();
  }
}
