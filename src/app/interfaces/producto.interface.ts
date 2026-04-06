import { CategoriaProducto } from "./categoria-producto.enum";

export type UnidadMedida = 'kg' | 'gr' | 'Lt' | 'ml' | 'Un' | '1/2 Doc' | 'Doc' | 'Atado' | 'Pack' | 'Lata' | 'Bolsa' | 'Paquete' | 'Caja';

export interface ProductoModel {
    id: string;
    name: string;
    marca: string;
    cantidad: number;
    unidadCantidad?: UnidadMedida;
    precio: number;
    cantidadPrecio?: number;
    unidadPrecio?: UnidadMedida;
    categoria: CategoriaProducto;
    idTarjetaCompras: string;
    comprar?: boolean;
    /** Sync: timestamp de última modificación (ms) */
    updatedAt?: number;
    /** Sync: uid de quien hizo el último cambio */
    updatedByUid?: string;
    /** Sync: nombre de quien hizo el último cambio */
    updatedByName?: string;
    /** Sync: true si fue eliminado (soft delete para no romper el merge) */
    deleted?: boolean;
}