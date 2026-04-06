export type CustomFormFieldType = 'text' | 'number' | 'checkbox' | 'date' | 'time' | 'link' | 'select';

export interface CustomFormField {
  id: string;
  label: string;
  type: CustomFormFieldType;
  required: boolean;
  options?: string[];
}

export interface CustomFormItem {
  id: string;
  createdAt: string;
  values: Record<string, any>;
  /** Sync: timestamp ms de última modificación */
  updatedAt?: number;
  /** Sync: uid de quien lo modificó */
  updatedByUid?: string;
  /** Sync: nombre de quien lo modificó */
  updatedByName?: string;
  /** Sync: true si fue eliminado (soft delete para no romper el merge) */
  deleted?: boolean;
}

export interface CustomForm {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  fields: CustomFormField[];
  items: CustomFormItem[];
  /** Si está vinculado a un grupo, referencia al doc de Firestore */
  linkedRef?: { groupId: string; firestoreKey: string };
}
