import { CategoriaTarjeta } from './categoria-tarjeta.enum';

export interface TarjetaComprasModel {
  id: string;
  name: string;
  categoria: CategoriaTarjeta;
  accentColor?: string;
  iconColor?: string;
  textColor?: string;
  /** Si está vinculada a un grupo, referencia al doc de Firestore */
  linkedRef?: { groupId: string; firestoreKey: string };
}