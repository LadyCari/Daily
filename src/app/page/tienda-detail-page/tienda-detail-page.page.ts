import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TarjetaTienda } from 'src/app/services/tarjeta-tienda.service';
import { TarjetaComprasModel } from 'src/app/interfaces/tarjeta-compras.interface';
import { CategoriaTarjetaInfo } from 'src/app/interfaces/categoria-tarjeta-info.enum';
import { CategoriaTarjeta } from 'src/app/interfaces/categoria-tarjeta.enum';
import { Producto } from 'src/app/services/producto.service';
import { ProductoModel } from 'src/app/interfaces/producto.interface';
import { AlertController, ModalController, ActionSheetController, ToastController, IonicModule } from '@ionic/angular';
import { ProductoComponent } from 'src/app/modal/producto/producto.component';
import { TarjetaTiendaComponent } from 'src/app/modal/tarjeta-tienda/tarjeta-tienda.component';
import { CategoriaProducto } from 'src/app/interfaces/categoria-producto.enum';
import { CategoriaProductoInfo } from '../../interfaces/categoria-producto-info.enum';
import { ShareService } from 'src/app/services/share.service';
import { LinkedTiendaService } from 'src/app/services/linked-tienda.service';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-tienda-detail-page',
  templateUrl: './tienda-detail-page.page.html',
  styleUrls: ['./tienda-detail-page.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TiendaDetailPagePage implements OnInit {

  tarjeta?: TarjetaComprasModel;
  productosOriginal: ProductoModel[] = [];
  productos: ProductoModel[] = [];
  categoriaInfo = CategoriaTarjetaInfo;
  categoriaProductoInfo = CategoriaProductoInfo;
  name: string = '';
  searchTerm: string = '';
  sortBy: 'name' | 'precio' | 'categoria' | 'comprar' = 'name';
  sortAsc = true;

  constructor(
    private route: ActivatedRoute,
    private tarjetaService: TarjetaTienda,
    private productoService: Producto,
    private alertCtrl: AlertController,
    private router: Router,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private shareSvc: ShareService,
    private linkedTiendaSvc: LinkedTiendaService,
    public  authSvc: AuthService,
    private groupSvc: GroupService,
  ) { }

  goBackToTiendas() {
    this.router.navigate(['/compra', 'tiendas']);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { return; }
    this.tarjeta = await this.tarjetaService.getTarjetaById(id) as TarjetaComprasModel | undefined;
    await this.loadProductos(id);
  }

  getIcon(categoria: any): string {
    const key = categoria as CategoriaTarjeta;
    return this.categoriaInfo[key]?.icono ?? 'fa-store';
  }

  // ── Exportar tienda ────────────────────────────────
  async exportarTienda() {
    if (!this.tarjeta) { return; }
    try {
      const { filename, json } = await this.tarjetaService.exportTiendaData(this.tarjeta.id);
      await this.shareSvc.shareFile(filename, json, this.tarjeta.name);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const toast = await this.toastCtrl.create({
          message: 'Error al exportar: ' + (e?.message ?? ''),
          duration: 2500, color: 'danger'
        });
        await toast.present();
      }
    }
  }

  // ── Editar nombre y categoría de la tienda ─────────────
  async editarTienda() {
    if (!this.tarjeta) { return; }
    const modal = await this.modalCtrl.create({
      component: TarjetaTiendaComponent,
      componentProps: {
        initialName: this.tarjeta.name,
        initialCategoria: this.tarjeta.categoria,
        initialAccentColor: this.tarjeta.accentColor,
        initialIconColor: this.tarjeta.iconColor,
        initialTextColor: this.tarjeta.textColor,
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.name) {
      await this.tarjetaService.updateTarjeta(
        this.tarjeta.id,
        data.name,
        data.categoria as CategoriaTarjeta,
        data.accentColor,
        data.iconColor,
        data.textColor,
      );
      this.tarjeta.name = data.name;
      this.tarjeta.categoria = data.categoria;
      this.tarjeta.accentColor = data.accentColor;
      this.tarjeta.iconColor = data.iconColor;
      this.tarjeta.textColor = data.textColor;
    }
  }

  async confirmDelete() {
    if (!this.tarjeta) { return; }
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Eliminar la tarjeta "${this.tarjeta.name}" y todos sus productos? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.deleteTarjetaAndProductos();
          }
        }
      ]
    });
    await alert.present();
  }

  private async deleteTarjetaAndProductos() {
    if (!this.tarjeta) { return; }
    // delete related products first
    for (const p of this.productos) {
      await this.productoService.deleteProducto(p.id);
    }
    // delete the tarjeta
    await this.tarjetaService.deleteTarjeta(this.tarjeta.id);
    // navigate back to compra (list of tiendas)
    await this.router.navigate(['/compra']);
  }

  async openAddProductoModal() {
    if (!this.tarjeta) { return; }
    const modal = await this.modalCtrl.create({
      component: ProductoComponent
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.name) {
      const syncMeta = this.buildSyncMeta();
      await this.productoService.addProducto(
        data.name,
        data.marca,
        Number(data.cantidad) || 0,
        (data.unidadCantidad ?? 'Un') as any,
        Number(data.precio) || 0,
        data.categoria as CategoriaProducto,
        this.tarjeta.id,
        (data.unidadPrecio ?? 'Un') as any,
        Number(data.cantidadPrecio) || 1,
        syncMeta
      );
      await this.loadProductos(this.tarjeta.id);
      this.autoPushLinked();
    }
  }

  async editProducto(producto: ProductoModel) {
    if (!this.tarjeta) { return; }
    const modal = await this.modalCtrl.create({
      component: ProductoComponent,
      componentProps: { producto }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.id) {
      const syncMeta = this.buildSyncMeta();
      await this.productoService.updateProducto(
        data.id,
        data.name,
        data.marca,
        Number(data.cantidad) || 0,
        (data.unidadCantidad ?? 'Un') as any,
        Number(data.precio) || 0,
        data.categoria as CategoriaProducto,
        this.tarjeta.id,
        (data.unidadPrecio ?? 'Un') as any,
        Number(data.cantidadPrecio) || 1,
        syncMeta
      );
      await this.loadProductos(this.tarjeta.id);
      this.autoPushLinked();
    }
  }

  async confirmDeleteProducto(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: '¿Eliminar este producto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    if (this.isLinked) {
      const user = this.authSvc.user();
      if (user) {
        await this.productoService.softDeleteProducto(id, { updatedAt: Date.now(), updatedByUid: user.uid, updatedByName: user.name });
        this.autoPushLinked();
      }
    } else {
      await this.productoService.deleteProducto(id);
    }
    if (this.tarjeta) { await this.loadProductos(this.tarjeta.id); }
  }

  async openProductoMenu(producto: ProductoModel) {
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

  private async loadProductos(tarjetaId: string) {
    const all = await this.productoService.loadAllProduct();
    this.productosOriginal = all.filter(p => p.idTarjetaCompras === tarjetaId && !p.deleted);
    this.productos = [...this.productosOriginal];
    this.applySort();
  }

  getProductoIcon(categoria: any): string {
    const key = categoria as CategoriaProducto;
    return this.categoriaProductoInfo[key]?.icono ?? 'fa-box';
  }

  setSort(by: 'name' | 'precio' | 'categoria' | 'comprar') {
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
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (this.sortBy === 'precio') {
        return (a.precio - b.precio) * dir;
      }
      if (this.sortBy === 'comprar') {
        const aVal = a.comprar ? 1 : 0;
        const bVal = b.comprar ? 1 : 0;
        return (bVal - aVal) * dir;
      }
      // categoria
      return String(a.categoria).localeCompare(String(b.categoria)) * dir;
    });
  }

  async toggleComprar(producto: ProductoModel) {
    await this.productoService.toggleComprar(producto.id);
    this.applySort();
    this.autoPushLinked();
  }

  private autoPushLinked(): void {
    if (!this.isLinked || !this.tarjeta) return;
    this.linkedTiendaSvc.syncLinkedTienda(this.tarjeta.id).catch(() => {});
  }

  private buildSyncMeta(): { updatedAt: number; updatedByUid: string; updatedByName: string } | undefined {
    if (!this.isLinked) return undefined;
    const user = this.authSvc.user();
    if (!user) return undefined;
    return { updatedAt: Date.now(), updatedByUid: user.uid, updatedByName: user.name };
  }

  tarjetaName(): string {
    return this.name = this.tarjeta?.name ?? 'Tienda';
  }

  get isLinked(): boolean { return !!this.tarjeta?.linkedRef; }

  // ── Vincular con grupo ─────────────────────────────
  async vincularConGrupo() {
    if (!this.tarjeta) return;
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
      header: 'Vincular tienda',
      message: `¿Vincular "${this.tarjeta?.name}" con el grupo "${groupName}"? Los miembros podrán ver y editar los productos cuando sincronicen.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Vincular', role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    try {
      await this.linkedTiendaSvc.shareTienda(this.tarjeta!.id, groupId);
      this.tarjeta = await this.tarjetaService.getTarjetaById(this.tarjeta!.id);
      await this.toast('✅ Tienda vinculada. Sincronizá en el grupo para compartirla.');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error'), 'danger');
    }
  }

  async syncLinked() {
    if (!this.tarjeta) return;
    try {
      await this.linkedTiendaSvc.syncLinkedTienda(this.tarjeta.id);
      await this.loadProductos(this.tarjeta.id);
      await this.toast('✅ Sincronizado');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error al sincronizar'), 'danger');
    }
  }

  async desvincularTienda() {
    if (!this.tarjeta) return;
    const alert = await this.alertCtrl.create({
      header: 'Desvincular tienda',
      message: '¿Desvincular esta tienda del grupo? Los productos quedarán en tu dispositivo pero dejarán de sincronizarse.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desvincular', role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    try {
      await this.linkedTiendaSvc.desvincularTienda(this.tarjeta.id);
      this.tarjeta = await this.tarjetaService.getTarjetaById(this.tarjeta.id);
      await this.toast('✅ Tienda desvinculada');
    } catch (e: any) {
      await this.toast('❌ ' + (e?.message ?? 'Error al desvincular'), 'danger');
    }
  }

  private async toast(message: string, color = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2800, color });
    await t.present();
  }
}
