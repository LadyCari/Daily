import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton } from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-add-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton],
})
export class AddHorarioComponent {

  title = '';
  startHour = '18:00';
  endHour: string | undefined = undefined;
  weekdays: number[] = [new Date().getDay()];
  isPrivate = false;

  readonly DIAS = [
    { label: 'Lu', value: 1 },
    { label: 'Ma', value: 2 },
    { label: 'Mi', value: 3 },
    { label: 'Ju', value: 4 },
    { label: 'Vi', value: 5 },
    { label: 'Sa', value: 6 },
    { label: 'Do', value: 0 },
  ];

  constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

  isDiaSeleccionado(value: number): boolean {
    return this.weekdays.includes(value);
  }

  toggleDia(value: number) {
    const idx = this.weekdays.indexOf(value);
    if (idx === -1) {
      this.weekdays = [...this.weekdays, value];
    } else {
      this.weekdays = this.weekdays.filter(d => d !== value);
    }
  }

  cancel() { this.modalCtrl.dismiss(); }

  submitAttempted = false;

  async save() {
    this.submitAttempted = true;
    const trimmed = (this.title || '').trim();
    const faltantes: string[] = [];
    if (!trimmed) faltantes.push('Título');
    if (!this.startHour) faltantes.push('Hora de inicio');
    if (this.weekdays.length === 0) faltantes.push('Al menos un día');
    if (faltantes.length) {
      await this.mostrarError(faltantes);
      return;
    }
    this.modalCtrl.dismiss({ title: trimmed, startHour: this.startHour, endHour: this.endHour, weekdays: this.weekdays, isPrivate: this.isPrivate });
  }

  private async mostrarError(campos: string[]) {
    const toast = await this.toastCtrl.create({
      message: `Falta completar: ${campos.join(', ')}`,
      duration: 2500,
      position: 'top',
      cssClass: 'neon-toast',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }
}
