/**
 * FirestoreService — wrapper genérico sobre Firebase Firestore (modular API v12).
 *
 * IMPORTANTE: antes de usar la app en producción, configurar las Firestore Security Rules
 * en la consola de Firebase (https://console.firebase.google.com → Firestore → Rules):
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read, write: if request.auth != null;
 *     }
 *   }
 * }
 *
 * (reglas de producción más estrictas se pueden ajustar luego)
 */
import { Injectable } from '@angular/core';
import {
  getFirestore,
  doc, collection, setDoc, getDoc, deleteDoc, addDoc,
  query, where, getDocs, onSnapshot,
  WhereFilterOp, Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  private get db(): Firestore {
    return getFirestore(getApp());
  }

  /** Crea o mergea un documento en la ruta dada */
  async setDoc(path: string, data: object): Promise<void> {
    await setDoc(doc(this.db, path), data, { merge: true });
  }

  /** Reemplaza el documento completo (sin merge) */
  async setDocFull(path: string, data: object): Promise<void> {
    await setDoc(doc(this.db, path), data);
  }

  /** Lee un documento. Devuelve null si no existe */
  async getDoc<T>(path: string): Promise<T | null> {
    const snap = await getDoc(doc(this.db, path));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as T;
  }

  /** Elimina un documento */
  async deleteDoc(path: string): Promise<void> {
    await deleteDoc(doc(this.db, path));
  }

  /** Agrega un doc con ID auto-generado. Devuelve el ID creado */
  async addDoc(collectionPath: string, data: object): Promise<string> {
    const ref = await addDoc(collection(this.db, collectionPath), data);
    return ref.id;
  }

  /** Query simple con un campo == valor */
  async queryWhere<T>(collectionPath: string, field: string, op: WhereFilterOp, value: any): Promise<T[]> {
    const q = query(collection(this.db, collectionPath), where(field, op, value));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
  }

  /** Query con dos condiciones WHERE */
  async queryWhere2<T>(
    collectionPath: string,
    field1: string, op1: WhereFilterOp, value1: any,
    field2: string, op2: WhereFilterOp, value2: any
  ): Promise<T[]> {
    const q = query(
      collection(this.db, collectionPath),
      where(field1, op1, value1),
      where(field2, op2, value2)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
  }

  /** Escucha cambios en tiempo real de una colección filtrada por un campo */
  listenWhere<T>(
    collectionPath: string,
    field: string, op: WhereFilterOp, value: any,
    callback: (docs: T[]) => void
  ): () => void {
    const q = query(collection(this.db, collectionPath), where(field, op, value));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as T));
    });
  }

  /** Escucha cambios en tiempo real de un documento */
  listenDoc<T>(path: string, callback: (data: T | null) => void): () => void {
    return onSnapshot(doc(this.db, path), snap => {
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
    });
  }
}
