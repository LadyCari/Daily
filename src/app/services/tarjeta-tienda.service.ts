import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TarjetaComprasModel } from '../interfaces/tarjeta-compras.interface';
import { CategoriaTarjeta } from '../interfaces/categoria-tarjeta.enum';
import { StorageService } from './storage.service';
import { Producto } from './producto.service';

@Injectable({
  providedIn: 'root',
})
export class TarjetaTienda {

  private readonly STORAGE_KEY = 'tarjetasCompras';
  private tarjetas: TarjetaComprasModel[] = [];
  readonly imported$ = new Subject<void>();

  constructor(
    private storage: StorageService,
    private productoService: Producto
  ) { }

  async loadAllTarjetas(): Promise<TarjetaComprasModel[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    return this.tarjetas = stored || [];
  }

  async addTarjeta(name: string, categoria: CategoriaTarjeta, accentColor?: string, iconColor?: string, textColor?: string): Promise<void> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    this.tarjetas = stored || [];

    const newTarjeta: TarjetaComprasModel = {
      id: Date.now().toString(),
      name,
      categoria,
      accentColor: accentColor || undefined,
      iconColor: iconColor || undefined,
      textColor: textColor || undefined,
    };

    this.tarjetas.push(newTarjeta);
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
  }


  async deleteTarjeta(id: string): Promise<void> {
    // Remove the tarjeta
    this.tarjetas = this.tarjetas.filter(t => t.id !== id);
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    // Also remove any productos that belonged to this tarjeta
    await this.productoService.deleteProductosByTarjetaId(id);
  }

  async updateTarjeta(id: string, title: string, categoria: CategoriaTarjeta, accentColor?: string, iconColor?: string, textColor?: string): Promise<void> {
    const tarjeta = this.tarjetas.find(t => t.id === id);
    if (tarjeta) {
      tarjeta.name = title;
      tarjeta.categoria = categoria;
      tarjeta.accentColor = accentColor || tarjeta.accentColor;
      tarjeta.iconColor = iconColor || undefined;
      tarjeta.textColor = textColor || undefined;
      await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    }
  }

  async updateTarjetaAccentColor(id: string, accentColor?: string): Promise<void> {
    const tarjeta = this.tarjetas.find(t => t.id === id);
    if (!tarjeta) return;
    tarjeta.accentColor = accentColor || undefined;
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
  }

  async getTarjetaById(id: string): Promise<TarjetaComprasModel | undefined> {
    await this.loadAllTarjetas();
    return this.tarjetas.find(t => t.id === id);
  }

  // ── Exportar ────────────────────────────────────────
  async exportTiendaData(tiendaId: string): Promise<{ filename: string; json: string }> {
    const tienda = await this.getTarjetaById(tiendaId);
    if (!tienda) throw new Error('Tienda no encontrada');
    const todosProductos = await this.productoService.loadAllProduct();
    const productos = todosProductos
      .filter(p => p.idTarjetaCompras === tiendaId)
      .map(({ id, idTarjetaCompras, comprar, ...rest }) => rest);
    const json = JSON.stringify({ v: 1, tienda: { name: tienda.name, categoria: tienda.categoria, accentColor: tienda.accentColor, iconColor: tienda.iconColor, textColor: tienda.textColor }, productos }, null, 2);
    const filename = `tienda-${tienda.name.replace(/\s+/g, '_')}.json`;
    return { filename, json };
  }

  // ── Importar ────────────────────────────────────────
  async importTiendaFromJson(json: string): Promise<void> {
    const payload = JSON.parse(json);
    if (!payload?.tienda?.name) throw new Error('Archivo inválido');
    const newId = Date.now().toString();
    const newTienda: TarjetaComprasModel = {
      id: newId,
      name: payload.tienda.name,
      categoria: payload.tienda.categoria,
      accentColor: payload.tienda.accentColor,
      iconColor: payload.tienda.iconColor,
      textColor: payload.tienda.textColor,
    };
    await this.loadAllTarjetas();
    this.tarjetas.push(newTienda);
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    if (Array.isArray(payload.productos)) {
      for (const p of payload.productos) {
        await this.productoService.addProducto(
          p.name, p.marca ?? '', p.cantidad ?? 1,
          (p.unidadCantidad ?? 'Un') as any,
          p.precio ?? 0, p.categoria, newId
        );
      }
    }
    this.imported$.next();
  }

  async saveOrder(tiendas: TarjetaComprasModel[]): Promise<void> {
    this.tarjetas = tiendas;
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
  }

  /** Marca una tienda existente como vinculada a un grupo */
  async setLinkedRef(tiendaId: string, linkedRef: { groupId: string; firestoreKey: string }): Promise<void> {
    await this.loadAllTarjetas();
    const t = this.tarjetas.find(t => t.id === tiendaId);
    if (t) {
      t.linkedRef = linkedRef;
      await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    }
  }

  /** Elimina el linkedRef de una tienda (desvincular) */
  async clearLinkedRef(tiendaId: string): Promise<void> {
    await this.loadAllTarjetas();
    const t = this.tarjetas.find(t => t.id === tiendaId);
    if (t) {
      delete t.linkedRef;
      await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    }
  }

  /** Agrega una tienda completa directamente (usada al recibir tienda vinculada de otro) */
  async addTiendaDirecta(tienda: TarjetaComprasModel): Promise<void> {
    await this.loadAllTarjetas();
    this.tarjetas.push(tienda);
    await this.storage.set(this.STORAGE_KEY, this.tarjetas);
    this.imported$.next();
  }

}
