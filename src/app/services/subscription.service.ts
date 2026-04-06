import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Subscription, SyncSection, ALL_SECTIONS } from '../interfaces/grupo.interface';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  private fs   = inject(FirestoreService);
  private auth = inject(AuthService);

  /** ID compuesto del documento de suscripción */
  private subDocId(groupId: string, receiverUid: string, senderUid: string): string {
    return `${groupId}_${receiverUid}_${senderUid}`;
  }

  /**
   * Devuelve mi suscripción respecto a un emisor en un grupo.
   * Si no existe, devuelve todas las secciones en false.
   */
  async getMySub(groupId: string, senderUid: string): Promise<Subscription> {
    const myUid = this.auth.user()?.uid ?? '';
    const path  = `subscriptions/${this.subDocId(groupId, myUid, senderUid)}`;
    const saved = await this.fs.getDoc<Subscription>(path);

    if (saved) return saved;

    // Default: todo en false
    const defaults: Subscription = {
      groupId,
      receiverUid: myUid,
      senderUid,
      horario: false,
      eventos: false,
      todos:   false,
      gastos:  false,
    };
    return defaults;
  }

  /** Guarda (o actualiza) mi suscripción respecto a un emisor */
  async saveSub(sub: Subscription): Promise<void> {
    const path = `subscriptions/${this.subDocId(sub.groupId, sub.receiverUid, sub.senderUid)}`;
    await this.fs.setDoc(path, sub);
  }

  /** Activa o desactiva una sección específica de mi suscripción */
  async toggleSection(groupId: string, senderUid: string, section: SyncSection, value: boolean): Promise<void> {
    const sub = await this.getMySub(groupId, senderUid);
    sub[section] = value;
    await this.saveSub(sub);
  }

  /**
   * Devuelve todas mis suscripciones activas en un grupo.
   * Solo devuelve las que tienen al menos una sección en true.
   */
  async getMyActiveSubs(groupId: string, senderUids: string[]): Promise<Subscription[]> {
    const myUid = this.auth.user()?.uid ?? '';
    const subs: Subscription[] = [];
    for (const senderUid of senderUids) {
      const sub = await this.getMySub(groupId, senderUid);
      const hasAny = ALL_SECTIONS.some(s => sub[s]);
      if (hasAny) subs.push(sub);
    }
    return subs;
  }

  /** Devuelve qué secciones tengo activas de un emisor */
  getActiveSections(sub: Subscription): SyncSection[] {
    return ALL_SECTIONS.filter(s => sub[s]);
  }
}
