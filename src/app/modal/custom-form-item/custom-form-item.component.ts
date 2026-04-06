import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CustomFormField } from 'src/app/interfaces/custom-form.interface';

@Component({
  selector: 'app-custom-form-item-modal',
  templateUrl: './custom-form-item.component.html',
  styleUrls: ['./custom-form-item.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CustomFormItemModalComponent {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() title = '';
  @Input() fields: CustomFormField[] = [];
  @Input() initialValues: Record<string, any> = {};

  values: Record<string, any> = {};

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }

  ionViewWillEnter() {
    this.values = { ...(this.initialValues ?? {}) };
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  submitAttempted = false;

  async save() {
    this.submitAttempted = true;
    const missing: string[] = [];

    for (const f of this.fields) {
      if (!f.required) continue;

      const v = this.values?.[f.id];
      if (f.type === 'checkbox') {
        continue;
      }

      if (v === undefined || v === null || String(v).trim() === '') {
        missing.push(f.label);
      }
    }

    if (missing.length) {
      const t = await this.toastCtrl.create({
        message: `Falta completar: ${missing.join(', ')}`,
        duration: 2500,
        position: 'top',
        cssClass: 'neon-toast',
        icon: 'alert-circle-outline'
      });
      await t.present();
      return;
    }

    this.modalCtrl.dismiss({ values: this.values });
  }

  isCheckbox(field: CustomFormField): boolean {
    return field.type === 'checkbox';
  }

  isSelect(field: CustomFormField): boolean {
    return field.type === 'select';
  }

  getInputType(field: CustomFormField): string {
    switch (field.type) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      case 'link':
        return 'url';
      default:
        return 'text';
    }
  }
}
