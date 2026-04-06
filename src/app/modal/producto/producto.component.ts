import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonFooter, IonButton, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';
import { CategoriaProducto } from 'src/app/interfaces/categoria-producto.enum';
import { CategoriaProductoInfo } from 'src/app/interfaces/categoria-producto-info.enum';
import { ProductoModel, UnidadMedida } from 'src/app/interfaces/producto.interface';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonFooter, IonButton, IonSelect, IonSelectOption]
})
export class ProductoComponent implements OnInit {

  @Input() producto?: ProductoModel;

  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: CategoriaProducto | '' = '';
  name: string = '';
  marca: string = '';
  cantidad: number = 0;
  unidadCantidad: UnidadMedida = 'Un';
  precio: number = 0;
  cantidadPrecio: number = 1;
  unidadPrecio: UnidadMedida = 'Un';

  readonly UNIDADES: { value: UnidadMedida; label: string }[] = [
    { value: 'kg', label: 'kg' },
    { value: 'gr', label: 'gr' },
    { value: 'Lt', label: 'Lt' },
    { value: 'ml', label: 'ml' },
    { value: 'Un', label: 'Un' },
    { value: 'Doc', label: 'Doc' },
    { value: '1/2 Doc', label: '1/2 Doc' },
    { value: 'Atado', label: 'Atado' },
    { value: 'Pack', label: 'Pack' },
    { value: 'Lata', label: 'Lata' },
    { value: 'Bolsa', label: 'Bolsa' },
    { value: 'Paquete', label: 'Paquete' },
    { value: 'Caja', label: 'Caja' }
  ];

  constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

  ngOnInit(): void {
    this.allCategories();
    if (this.producto) {
      this.name = this.producto.name;
      this.marca = this.producto.marca;
      this.cantidad = this.producto.cantidad;
      this.unidadCantidad = (this.producto.unidadCantidad ?? 'Un') as any;
      this.precio = this.producto.precio;
      this.cantidadPrecio = this.producto.cantidadPrecio ?? 1;
      this.unidadPrecio = (this.producto.unidadPrecio ?? 'Un') as any;
      this.categoriaSeleccionada = this.producto.categoria as CategoriaProducto;
    }
  }

  cancel() { this.modalCtrl.dismiss(); }

  submitAttempted = false;

  async save() {
    this.submitAttempted = true;
    const trimmed = (this.name || '').trim();
    const faltantes: string[] = [];
    if (!trimmed) faltantes.push('Nombre del producto');
    if (faltantes.length) {
      await this.mostrarError(faltantes);
      return;
    }
    const payload: any = { name: trimmed, categoria: this.categoriaSeleccionada, marca: this.marca, cantidad: this.cantidad, unidadCantidad: this.unidadCantidad, precio: this.precio, cantidadPrecio: this.cantidadPrecio, unidadPrecio: this.unidadPrecio };
    if (this.producto?.id) { payload.id = this.producto.id; }
    this.modalCtrl.dismiss(payload);
  }

  allCategories() {
    this.categorias = Object.values(CategoriaProducto) as CategoriaProducto[];
  }

  getCategoriaLabel(categoria: any): string {
    const key = categoria as CategoriaProducto;
    return CategoriaProductoInfo[key]?.label ?? String(categoria);
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
