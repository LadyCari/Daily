import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonFooter, IonButton, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CategoriaTarjeta } from 'src/app/interfaces/categoria-tarjeta.enum';
import { CategoriaTarjetaInfo } from 'src/app/interfaces/categoria-tarjeta-info.enum';

@Component({
  selector: 'app-tarjeta-tienda',
  templateUrl: './tarjeta-tienda.component.html',
  styleUrls: ['./tarjeta-tienda.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonFooter, IonButton, IonSelect, IonSelectOption]
})
export class TarjetaTiendaComponent implements OnInit {

  @Input() initialName: string = '';
  @Input() initialCategoria: CategoriaTarjeta | '' = '';
  @Input() initialAccentColor: string = '';
  @Input() initialIconColor: string = '';
  @Input() initialTextColor: string = '';

  categorias: CategoriaTarjeta[] = [];
  categoriaSeleccionada: CategoriaTarjeta | '' = '';
  categoriaInfo = CategoriaTarjetaInfo;
  name: string = '';
  accentColor: string = '';
  iconColor: string = '';
  textColor: string = '';

  constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

  ngOnInit() {
    this.allCategories();
    if (this.initialName) { this.name = this.initialName; }
    if (this.initialCategoria) { this.categoriaSeleccionada = this.initialCategoria; }
    if (this.initialAccentColor) { this.accentColor = this.initialAccentColor; }
    if (this.initialIconColor) { this.iconColor = this.initialIconColor; }
    if (this.initialTextColor) { this.textColor = this.initialTextColor; }
  }

  cancel() { this.modalCtrl.dismiss(); }

  submitAttempted = false;

  async save() {
    this.submitAttempted = true;
    const trimmed = (this.name || '').trim();
    const faltantes: string[] = [];
    if (!trimmed) faltantes.push('Nombre de la tienda');
    if (faltantes.length) {
      await this.mostrarError(faltantes);
      return;
    }
    this.modalCtrl.dismiss({
      name: trimmed,
      categoria: this.categoriaSeleccionada,
      accentColor: (this.accentColor || '').trim() || undefined,
      iconColor: (this.iconColor || '').trim() || undefined,
      textColor: (this.textColor || '').trim() || undefined,
    });
  }

  allCategories() {
    this.categorias = Object.values(CategoriaTarjeta) as CategoriaTarjeta[];
  }

  getCategoriaLabel(categoria: any): string {
    const key = categoria as CategoriaTarjeta;
    return this.categoriaInfo[key]?.label ?? String(categoria);
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
