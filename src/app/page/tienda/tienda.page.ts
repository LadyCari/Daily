import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaTarjeta } from 'src/app/interfaces/categoria-tarjeta.enum';
import { CategoriaTarjetaInfo } from 'src/app/interfaces/categoria-tarjeta-info.enum';
import { TarjetaTiendaComponent } from 'src/app/modal/tarjeta-tienda/tarjeta-tienda.component';
import { ModalController, AlertController, ActionSheetController, ToastController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TarjetaTienda } from 'src/app/services/tarjeta-tienda.service';
import { Producto } from 'src/app/services/producto.service';
import { TarjetaComprasModel } from 'src/app/interfaces/tarjeta-compras.interface';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ShareService } from 'src/app/services/share.service';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.page.html',
  styleUrls: ['./tienda.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DragDropModule]
})
export class TiendaPage implements OnInit, OnDestroy {

  categorias = Object.values(CategoriaTarjeta) as CategoriaTarjeta[];
  categoriaInfo = CategoriaTarjetaInfo;
  tiendas: TarjetaComprasModel[] = [];
  conteoProductos: Record<string, number> = {};
  tiendasRecibidas: { items: any[]; senderName: string; senderUid: string }[] = [];
  private importSub?: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private tarjetaTiendaService: TarjetaTienda,
    private productoService: Producto,
    private router: Router,
    private shareSvc: ShareService,
  ) { }

  ngOnInit() {
    this.loadAllTarjetas();
    this.loadRecibidas();
    this.importSub = this.tarjetaTiendaService.imported$.subscribe(() => this.loadAllTarjetas());
  }

  private async loadRecibidas() {
    this.tiendasRecibidas = [];
  }

  ngOnDestroy() { this.importSub?.unsubscribe(); }

  async loadAllTarjetas() {
    this.tiendas = await this.tarjetaTiendaService.loadAllTarjetas();
    const todosProductos = await this.productoService.loadAllProduct();
    this.conteoProductos = {};
    for (const t of this.tiendas) {
      this.conteoProductos[t.id] = todosProductos.filter(p => p.idTarjetaCompras === t.id).length;
    }
  }

  async openAddTiendaModal() {
    const modal = await this.modalCtrl.create({ component: TarjetaTiendaComponent });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.name) {
      await this.tarjetaTiendaService.addTarjeta(data.name, data.categoria as CategoriaTarjeta, data.accentColor, data.iconColor, data.textColor);
      await this.loadAllTarjetas();
    }
  }

  getIcon(categoria: any): string {
    return this.categoriaInfo[categoria as CategoriaTarjeta]?.icono ?? 'fa-store';
  }

  openTienda(id: string) {
    this.router.navigate(['/compra', 'tienda', id]);
  }

  // ── Menú 3 puntos por tarjeta ─────────────────────
  async openTiendaMenu(event: Event, tienda: TarjetaComprasModel) {
    event.stopPropagation(); // evitar que abra la tienda
    const sheet = await this.actionSheetCtrl.create({
      header: tienda.name,
      buttons: [
        {
          text: 'Exportar / Compartir',
          icon: 'share-social-outline',
          handler: () => this.exportarTienda(tienda)
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmarEliminar(tienda)
        },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  // ── Exportar ──────────────────────────────────────
  async exportarTienda(tienda: TarjetaComprasModel) {
    try {
      const { filename, json } = await this.tarjetaTiendaService.exportTiendaData(tienda.id);
      await this.shareSvc.shareFile(filename, json, tienda.name);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const toast = await this.toastCtrl.create({ message: 'Error al exportar', duration: 2500, color: 'danger' });
        await toast.present();
      }
    }
  }

  // ── Importar ──────────────────────────────────────
  async importarTienda() {
    try {
      const json = await this.shareSvc.readFile();
      await this.tarjetaTiendaService.importTiendaFromJson(json);
      await this.loadAllTarjetas();
      const toast = await this.toastCtrl.create({ message: '✅ Tienda importada correctamente', duration: 2000, color: 'success' });
      await toast.present();
    } catch (e: any) {
      if (e?.message === 'Cancelado') return;
      const toast = await this.toastCtrl.create({ message: '❌ Archivo inválido', duration: 2500, color: 'danger' });
      await toast.present();
    }
  }

  // ── Eliminar ──────────────────────────────────────
  async confirmarEliminar(tienda: TarjetaComprasModel) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tienda',
      message: `¿Eliminar "${tienda.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            await this.tarjetaTiendaService.deleteTarjeta(tienda.id);
            await this.loadAllTarjetas();
          }
        }
      ]
    });
    await alert.present();
  }
  async onReorder(event: CdkDragDrop<TarjetaComprasModel[]>) {
    moveItemInArray(this.tiendas, event.previousIndex, event.currentIndex);
    await this.tarjetaTiendaService.saveOrder(this.tiendas);
  }
}
