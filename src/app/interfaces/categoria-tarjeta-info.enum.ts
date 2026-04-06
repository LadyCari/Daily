import { CategoriaTarjeta } from "./categoria-tarjeta.enum";

type CategoriaInfo = {
  label: string;
  icono: string;
};

export const CategoriaTarjetaInfo: Record<CategoriaTarjeta, CategoriaInfo> = {
  [CategoriaTarjeta.SUPERMERCADO]: {
    label: 'Supermercado',
    icono: 'fa-basket-shopping'
  },
  [CategoriaTarjeta.CARNICERIA]: {
    label: 'carniceria',
    icono: 'fa-drumstick-bite'
  },
  [CategoriaTarjeta.VERDULERIA]: {
    label: 'verduleria',
    icono: 'fa-carrot'
  },
  [CategoriaTarjeta.BEBIDA]: {
    label: 'bebida',
    icono: 'fa-wine-bottle'
  },
  [CategoriaTarjeta.TIENDA]: {
    label: 'Tienda',
    icono: 'fa-store'
  },
  [CategoriaTarjeta.DIETETICA]: {
    label: 'dietetica',
    icono: 'fa-jar-wheat'
  },
  [CategoriaTarjeta.VETERINARIA]: {
    label: 'veterinaria',
    icono: 'fa-paw'
  },
  [CategoriaTarjeta.PANADERIA]: {
    label: 'panaderia',
    icono: 'fa-bread-slice'
  },
  [CategoriaTarjeta.OTROS]: {
    label: 'Otros',
    icono: 'fa-box'
  }, [CategoriaTarjeta.FARMACIA]: {
    label: 'Farmacia',
    icono: 'fa-prescription-bottle-medical'
  },
  [CategoriaTarjeta.FERRETERIA]: {
    label: 'Ferretería',
    icono: 'fa-hammer'
  },
  [CategoriaTarjeta.KIOSCO]: {
    label: 'Kiosco',
    icono: 'fa-candy-bar'
  },
  [CategoriaTarjeta.HELADERIA]: {
    label: 'Heladería',
    icono: 'fa-ice-cream'
  },
  [CategoriaTarjeta.ROPA]: {
    label: 'Ropa',
    icono: 'fa-shirt'
  },
  [CategoriaTarjeta.ELECTRONICA]: {
    label: 'Electrónica',
    icono: 'fa-tv'
  },
  [CategoriaTarjeta.LIBRERIA]: {
    label: 'Librería',
    icono: 'fa-book'
  },
  [CategoriaTarjeta.JUGUETERIA]: {
    label: 'Juguetería',
    icono: 'fa-puzzle-piece'
  },
  [CategoriaTarjeta.FIAMBRERIA]: {
    label: 'Fiambrería',
    icono: 'fa-cheese'
  },
  [CategoriaTarjeta.PESCADERIA]: {
    label: 'Pescadería',
    icono: 'fa-fish'
  },
  [CategoriaTarjeta.BAZAR]: {
    label: 'Bazar',
    icono: 'fa-kitchen-set'
  },
  [CategoriaTarjeta.MUEBLERIA]: {
    label: 'Mueblería',
    icono: 'fa-couch'
  },
  [CategoriaTarjeta.LIMPIEZA]: {
    label: 'Artículos de limpieza',
    icono: 'fa-broom'
  }
};

