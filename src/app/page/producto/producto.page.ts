import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ModalController, ActionSheetController, IonicModule } from '@ionic/angular';
import { Producto } from 'src/app/services/producto.service';
import { ProductoModel } from 'src/app/interfaces/producto.interface';
import { TarjetaTienda } from 'src/app/services/tarjeta-tienda.service';
import { TarjetaComprasModel } from 'src/app/interfaces/tarjeta-compras.interface';
import { CategoriaProducto } from 'src/app/interfaces/categoria-producto.enum';
import { CategoriaProductoInfo } from 'src/app/interfaces/categoria-producto-info.enum';
import { ProductoComponent } from 'src/app/modal/producto/producto.component';

export interface ProductoConTienda extends ProductoModel {
  tiendaNombre: string;
}

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProductoPage implements OnInit {

  productosOriginal: ProductoConTienda[] = [];
  productos: ProductoConTienda[] = [];
  tarjetas: TarjetaComprasModel[] = [];
  categoriaProductoInfo = CategoriaProductoInfo;

  searchTerm: string = '';

  sortBy: 'name' | 'precio' | 'categoria' | 'comprar' | 'tienda' = 'name';
  sortAsc = true;

  constructor(
    private productoService: Producto,
    private tarjetaService: TarjetaTienda,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
  ) { }

  async ngOnInit() {
    await this.loadAll();
  }

  async ionViewWillEnter() {
    await this.loadAll();
  }

  private async loadAll() {
    this.tarjetas = await this.tarjetaService.loadAllTarjetas();
    const all = await this.productoService.loadAllProduct();
    this.productosOriginal = all.map(p => ({
      ...p,
      tiendaNombre: this.tarjetas.find(t => t.id === p.idTarjetaCompras)?.name ?? 'Sin tienda'
    }));
    this.productos = [...this.productosOriginal];
    this.applySort();
  }

  getProductoIcon(categoria: any): string {
    const key = categoria as CategoriaProducto;
    return this.categoriaProductoInfo[key]?.icono ?? 'fa-box';
  }

  setSort(by: 'name' | 'precio' | 'categoria' | 'comprar' | 'tienda') {
    if (this.sortBy === by) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = by;
      this.sortAsc = true;
    }
    this.applySort();
  }

  applySort() {
    let filtrados = this.productosOriginal;
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtrados = filtrados.filter(p => p.name.toLowerCase().includes(term));
    }

    const dir = this.sortAsc ? 1 : -1;
    this.productos = [...filtrados].sort((a, b) => {
      if (this.sortBy === 'name') return a.name.localeCompare(b.name) * dir;
      if (this.sortBy === 'precio') return (a.precio - b.precio) * dir;
      if (this.sortBy === 'tienda') return a.tiendaNombre.localeCompare(b.tiendaNombre) * dir;
      if (this.sortBy === 'comprar') {
        const aVal = a.comprar ? 1 : 0;
        const bVal = b.comprar ? 1 : 0;
        return (bVal - aVal) * dir;
      }
      return String(a.categoria).localeCompare(String(b.categoria)) * dir;
    });
  }

  async toggleComprar(producto: ProductoConTienda) {
    await this.productoService.toggleComprar(producto.id);
    producto.comprar = !producto.comprar;
    this.applySort();
  }

  async openProductoMenu(producto: ProductoConTienda) {
    const sheet = await this.actionSheetCtrl.create({
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => { this.editProducto(producto); }
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => { this.confirmDeleteProducto(producto.id); }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await sheet.present();
  }

  async editProducto(producto: ProductoConTienda) {
    const modal = await this.modalCtrl.create({
      component: ProductoComponent,
      componentProps: { producto }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.id) {
      await this.productoService.updateProducto(
        data.id, data.name, data.marca,
        Number(data.cantidad) || 0,
        (data.unidadCantidad ?? 'Un') as any,
        Number(data.precio) || 0,
        data.categoria as CategoriaProducto,
        producto.idTarjetaCompras,
        (data.unidadPrecio ?? 'Un') as any,
        Number(data.cantidadPrecio) || 1
      );
      await this.loadAll();
    }
  }

  async confirmDeleteProducto(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: '¿Eliminar este producto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive', handler: async () => {
            await this.productoService.deleteProducto(id);
            await this.loadAll();
          }
        }
      ]
    });
    await alert.present();
  }
}
