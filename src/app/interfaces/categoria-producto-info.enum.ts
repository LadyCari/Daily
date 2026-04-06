import { CategoriaProducto } from './categoria-producto.enum';

type CategoriaInfo = {
  label: string;
  icono: string;
};

export const CategoriaProductoInfo: Record<CategoriaProducto, CategoriaInfo> = {
  [CategoriaProducto.BEBIDA]: { label: 'Bebidas', icono: 'fa-wine-bottle' },
  [CategoriaProducto.CARNE]: { label: 'Carnes', icono: 'fa-bacon' },
  [CategoriaProducto.CONDIMENTO]: { label: 'Condimentos', icono: 'fa-mortar-pestle' },
  [CategoriaProducto.CONGELADOS]: { label: 'Congelados', icono: 'fa-snowflake' },
  [CategoriaProducto.DESAYUNO]: { label: 'Desayuno / Merienda', icono: 'fa-mug-hot' },
  [CategoriaProducto.DULCES]: { label: 'Dulces', icono: 'fa-candy-cane' },
  [CategoriaProducto.FIAMBRES]: { label: 'Fiambres', icono: 'fa-drumstick-bite' },
  [CategoriaProducto.FRUTAS]: { label: 'Frutas', icono: 'fa-apple-alt' },
  [CategoriaProducto.HIGIENE]: { label: 'Higiene personal', icono: 'fa-pump-soap' },
  [CategoriaProducto.LACTEO]: { label: 'Lácteos', icono: 'fa-cheese' },
  [CategoriaProducto.LEGUMBRES]: { label: 'Legumbres', icono: 'fa-seedling' },
  [CategoriaProducto.LIMPIEZA]: { label: 'Limpieza', icono: 'fa-soap' },
  [CategoriaProducto.MASCOTAS]: { label: 'Mascotas', icono: 'fa-dog' },
  [CategoriaProducto.OTROS]: { label: 'Otros', icono: 'fa-box' },
  [CategoriaProducto.PANADERIA]: { label: 'Panadería', icono: 'fa-bread-slice' },
  [CategoriaProducto.PASTAS]: { label: 'Pastas y arroz', icono: 'fa-utensils' },
  [CategoriaProducto.SNACK]: { label: 'Snacks', icono: 'fa-cookie-bite' },
  [CategoriaProducto.VERDURA]: { label: 'Verduras', icono: 'fa-carrot' }
};
