import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HeaderComponent } from '../header/header.page';
import { CustomFormsService } from 'src/app/services/custom-forms.service';
import { CustomForm, CustomFormField } from 'src/app/interfaces/custom-form.interface';
import { CustomFormFieldModalComponent } from 'src/app/modal/custom-form-field/custom-form-field.component';

@Component({
  selector: 'app-forms-fields',
  templateUrl: './forms-fields.page.html',
  styleUrls: ['./forms-fields.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, DragDropModule]
})
export class FormsFieldsPage {
  form?: CustomForm;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customForms: CustomFormsService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) { }

  async ionViewWillEnter() {
    await this.load();
  }

  private async load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/forms']);
      return;
    }

    this.form = await this.customForms.getById(id);
    if (!this.form) {
      this.router.navigate(['/forms']);
    }
  }

  backToForm() {
    if (!this.form) {
      this.router.navigate(['/forms']);
      return;
    }
    this.router.navigate(['/forms', this.form.id]);
  }

  async onReorder(event: CdkDragDrop<CustomFormField[]>) {
    if (!this.form) return;
    moveItemInArray(this.form.fields, event.previousIndex, event.currentIndex);
    await this.customForms.reorderFields(this.form.id, this.form.fields);
  }

  private applyModalStyles(modal: HTMLIonModalElement) {
    modal.style.setProperty('--modal-accent', 'var(--ion-color-neon, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'rgba(43, 248, 255, 0.22)');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-extra, #07070a)');
    modal.style.setProperty('--modal-glow', 'rgba(43, 248, 255, 0.15)');
    modal.style.setProperty('--modal-input-border', 'rgba(43, 248, 255, 0.22)');
    modal.style.setProperty('--modal-input-glow', 'rgba(43, 248, 255, 0.20)');
  }

  async addField() {
    if (!this.form) return;

    const modal = await this.modalCtrl.create({
      component: CustomFormFieldModalComponent,
      componentProps: { mode: 'create' },
      cssClass: 'themed-modal'
    });
    this.applyModalStyles(modal);
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data) return;

    await this.customForms.addField(this.form.id, data);
    await this.load();
  }

  async editField(field: CustomFormField) {
    if (!this.form) return;

    const modal = await this.modalCtrl.create({
      component: CustomFormFieldModalComponent,
      componentProps: { mode: 'edit', field: this.customForms.normalizeFieldForEdit(field) },
      cssClass: 'themed-modal'
    });
    this.applyModalStyles(modal);
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data) return;

    const normalized = this.customForms.normalizeFieldForSave({ ...field, ...data });
    await this.customForms.updateField(this.form.id, normalized);
    await this.load();
  }

  async deleteField(field: CustomFormField) {
    if (!this.form) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar campo',
      message: `¿Eliminar "${field.label}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.customForms.deleteField(this.form!.id, field.id);
            await this.load();
          }
        }
      ]
    });
    await alert.present();
  }
}
