import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton } from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-add-todo',
  templateUrl: './todo.component.html',
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton],
  styleUrls: ['./todo.component.scss'],
  standalone: true,
})
export class AddTodoComponent {

  /*--------------------------Variables--------------------------*/

  title = '';
  isPrivate = false;
  focused = false;
  requiredFields: Record<string, string> = {
    title: 'Título',
  };

  constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

  /*--------------------------Cerrar--------------------------*/

  cancel() {
    this.modalCtrl.dismiss();
  }

  /*--------------------------Save--------------------------*/

  submitAttempted = false;

  async save() {
    this.submitAttempted = true;
    const missingFields = this.validateRequiredFields();

    if (missingFields.length > 0) {
      await this.showValidationError(missingFields);
      return;
    }

    this.modalCtrl.dismiss({
      title: this.title.trim(),
      isPrivate: this.isPrivate
    });
  }

  /*--------------------------Error--------------------------*/

  async showValidationError(fields: string[]) {
    const message = `Faltan completar: ${fields.join(', ')}`;

    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      cssClass: 'neon-toast',
      icon: 'alert-circle-outline'
    });

    await toast.present();
  }

  validateRequiredFields(): string[] {
    const missing: string[] = [];

    Object.keys(this.requiredFields).forEach((field) => {
      const value = (this as any)[field];

      if (!value || !value.toString().trim()) {
        missing.push(this.requiredFields[field]);
      }
    });

    return missing;
  }
}
