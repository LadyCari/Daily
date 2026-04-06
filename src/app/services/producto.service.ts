import { Injectable } from '@angular/core';
import { ProductoModel, UnidadMedida } from '../interfaces/producto.interface';
import { StorageService } from './storage.service';
import { CategoriaProducto } from '../interfaces/categoria-producto.enum';

@Injectable({
  providedIn: 'root',
})
export class Producto {

  private readonly STORAGE_KEY = 'productos';
  private productos: ProductoModel[] = [];

  constructor(private storage: StorageService) {
    this.loadAllProduct();
  }

  async loadAllProduct(): Promise<ProductoModel[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    const raw: ProductoModel[] = stored || [];
    // migrate old entries (no unidadCantidad) → default to 'Un'
    this.productos = raw.map(p => ({
      ...p,
      unidadCantidad: (p as any).unidadCantidad ?? 'Un',
      cantidadPrecio: (p as any).cantidadPrecio ?? 1,
      unidadPrecio: (p as any).unidadPrecio ?? 'Un'
    }));
    await this.storage.set(this.STORAGE_KEY, this.productos);
    return this.productos;
  }

  async addProducto(name: string, marca: string, cantidad: number, unidadCantidad: UnidadMedida, precio: number, categoria: CategoriaProducto, idTarjetaCompras: string, unidadPrecio: UnidadMedida = 'Un', cantidadPrecio: number = 1, syncMeta?: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<void> {
    const newProducto: ProductoModel = {
      id: Date.now().toString(),
      name,
      marca,
      cantidad,
      unidadCantidad,
      precio,
      cantidadPrecio,
      unidadPrecio,
      categoria,
      idTarjetaCompras,
      comprar: false,
      ...(syncMeta ?? {})
    };
    this.productos.push(newProducto);
    await this.storage.set(this.STORAGE_KEY, this.productos);
  }

  async deleteProducto(id: string): Promise<void> {
    this.productos = this.productos.filter(t => t.id !== id);
    await this.storage.set(this.STORAGE_KEY, this.productos);
  }

  /** Soft delete: marca el producto como eliminado sin borrarlo del array (necesario para sync) */
  async softDeleteProducto(id: string, syncMeta: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<void> {
    const producto = this.productos.find(p => p.id === id);
    if (producto) {
      producto.deleted = true;
      producto.updatedAt = syncMeta.updatedAt;
      producto.updatedByUid = syncMeta.updatedByUid;
      producto.updatedByName = syncMeta.updatedByName;
      await this.storage.set(this.STORAGE_KEY, this.productos);
    }
  }

  /** Delete all products that belong to a given tarjeta (store) */
  async deleteProductosByTarjetaId(tarjetaId: string): Promise<void> {
    this.productos = this.productos.filter(t => t.idTarjetaCompras !== tarjetaId);
    await this.storage.set(this.STORAGE_KEY, this.productos);
  }

  async updateProducto(id: string, name: string, marca: string, cantidad: number, unidadCantidad: UnidadMedida, precio: number, categoria: CategoriaProducto, idTarjetaCompras: string, unidadPrecio: UnidadMedida = 'Un', cantidadPrecio: number = 1, syncMeta?: { updatedAt: number; updatedByUid: string; updatedByName: string }): Promise<void> {
    const producto = this.productos.find(t => t.id === id);
    if (producto) {
      producto.name = name;
      producto.marca = marca;
      producto.cantidad = cantidad;
      producto.unidadCantidad = unidadCantidad;
      producto.precio = precio;
      producto.cantidadPrecio = cantidadPrecio;
      producto.unidadPrecio = unidadPrecio;
      producto.categoria = categoria;
      producto.idTarjetaCompras = idTarjetaCompras;
      if (syncMeta) {
        producto.updatedAt = syncMeta.updatedAt;
        producto.updatedByUid = syncMeta.updatedByUid;
        producto.updatedByName = syncMeta.updatedByName;
      }
      await this.storage.set(this.STORAGE_KEY, this.productos);
    }
  }

  /** Reemplaza todos los productos de una tienda con la lista mergeada del sync */
  async replaceProductosForTienda(tiendaId: string, productos: ProductoModel[]): Promise<void> {
    await this.loadAllProduct();
    const otros = this.productos.filter(p => p.idTarjetaCompras !== tiendaId);
    this.productos = [...otros, ...productos];
    await this.storage.set(this.STORAGE_KEY, this.productos);
  }

  async toggleComprar(id: string): Promise<void> {
    const producto = this.productos.find(t => t.id === id);
    if (producto) {
      producto.comprar = !producto.comprar;
      await this.storage.set(this.STORAGE_KEY, this.productos);
    }
  }
}
