import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CustomFormField, CustomFormFieldType } from 'src/app/interfaces/custom-form.interface';

@Component({
  selector: 'app-custom-form-field-modal',
  templateUrl: './custom-form-field.component.html',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CustomFormFieldModalComponent {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() field?: CustomFormField;

  label = '';
  type: CustomFormFieldType = 'text';
  required = false;
  optionsText = '';

  readonly TYPES: { value: CustomFormFieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'checkbox', label: 'Check' },
    { value: 'date', label: 'Fecha' },
    { value: 'time', label: 'Hora' },
    { value: 'link', label: 'Link' },
    { value: 'select', label: 'Selector' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }

  ionViewWillEnter() {
    if (this.field) {
      this.label = this.field.label;
      this.type = this.field.type;
      this.required = this.field.required;
      this.optionsText = (this.field.options ?? []).join(', ');
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  async save() {
    const label = (this.label ?? '').trim();
    if (!label) {
      const t = await this.toastCtrl.create({ message: 'Ingresá un título de campo', duration: 1600, position: 'bottom' });
      await t.present();
      return;
    }

    const payload: any = {
      label,
      type: this.type,
      required: !!this.required
    };

    if (this.type === 'select') {
      const options = (this.optionsText ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (options.length === 0) {
        const t = await this.toastCtrl.create({ message: 'Agregá al menos 1 opción', duration: 1600, position: 'bottom' });
        await t.present();
        return;
      }

      payload.options = options;
    }

    this.modalCtrl.dismiss(payload);
  }
}
