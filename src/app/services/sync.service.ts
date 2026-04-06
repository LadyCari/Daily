import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { GroupService } from './group.service';
import { SubscriptionService } from './subscription.service';
import { NotificationService } from './notification.service';
import { SharedData, SyncSection, ALL_SECTIONS } from '../interfaces/grupo.interface';

/** Claves de Capacitor Preferences por sección */
const PREF_KEY: Record<SyncSection, string> = {
  horario: 'horario',
  eventos: 'eventosCalendario',
  todos:   'todos',
  gastos:  'grupos_gastos',
};

/** ID compuesto del documento de sharedData */
function sharedDataId(groupId: string, senderUid: string): string {
  return `${groupId}_${senderUid}`;
}

export interface ReceivedSection {
  senderUid:  string;
  senderName: string;
  section:    SyncSection;
  data:       any[];
  updatedAt:  number;
}

@Injectable({ providedIn: 'root' })
export class SyncService {

  private fs       = inject(FirestoreService);
  private auth     = inject(AuthService);
  private groupSvc = inject(GroupService);
  private subSvc   = inject(SubscriptionService);
  private notifSvc = inject(NotificationService);

  /** Datos recibidos de otros miembros, indexados por senderUid */
  readonly receivedData = signal<Map<string, SharedData>>(new Map());

  // ── PUSH ───────────────────────────────────────────────────────────────────

  /**
   * Sube toda la data local a Firestore para un grupo determinado.
   * Los otros miembros del grupo podrán descargar las secciones que suscribieron.
   */
  async pushToGroup(groupId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const payload: SharedData = {
      groupId,
      senderUid:   user.uid,
      senderName:  user.name,
      lastUpdated: Date.now(),
      horario: null,
      eventos: null,
      todos:   null,
      gastos:  null,
    };

    // Leer cada sección de Capacitor Preferences (filtrar items privados)
    for (const section of ALL_SECTIONS) {
      try {
        const { value } = await Preferences.get({ key: PREF_KEY[section] });
        if (value) {
          const parsed = JSON.parse(value);
          payload[section] = Array.isArray(parsed)
            ? parsed.filter((item: any) => !item.private)
            : parsed;
        } else {
          payload[section] = null;
        }
      } catch {
        payload[section] = null;
      }
    }

    await this.fs.setDoc(`sharedData/${sharedDataId(groupId, user.uid)}`, payload);
    await this.groupSvc.updateLastPushed(groupId);

    // Notificar a los otros miembros del grupo
    const group   = await this.groupSvc.getGroup(groupId);
    const members = await this.groupSvc.getMembers(groupId);
    await Promise.all(
      members
        .filter(m => m.uid !== user.uid)
        .map(m => this.notifSvc.addPartnerSyncNotif(
          m.uid, user.uid, user.name, groupId, group?.name ?? groupId
        ))
    );
  }

  /** Push a todos los grupos donde soy miembro */
  async pushToAllGroups(): Promise<void> {
    const grupos = await this.groupSvc.getMyGroups();
    await Promise.all(grupos.map(g => this.pushToGroup(g.id)));
  }

  // ── PULL ───────────────────────────────────────────────────────────────────

  /**
   * Descarga los datos de los miembros suscriptos en un grupo,
   * los guarda en memoria (signal) y en Preferences para persistencia.
   */
  async pullFromGroup(groupId: string): Promise<void> {
    const myUid = this.auth.user()?.uid;
    if (!myUid) return;

    const members = await this.groupSvc.getMembers(groupId);
    const others  = members.filter(m => m.uid !== myUid);

    const newMap = new Map(this.receivedData());

    for (const member of others) {
      const sub    = await this.subSvc.getMySub(groupId, member.uid);
      const hasAny = ALL_SECTIONS.some(s => sub[s]);
      if (!hasAny) continue;

      const shared = await this.fs.getDoc<SharedData>(`sharedData/${sharedDataId(groupId, member.uid)}`);
      if (!shared) continue;

      // Filtrar: solo las secciones suscriptas
      const filtered: SharedData = {
        ...shared,
        horario: sub.horario ? shared.horario : null,
        eventos: sub.eventos ? shared.eventos : null,
        todos:   sub.todos   ? shared.todos   : null,
        gastos:  sub.gastos  ? shared.gastos  : null,
      };
      newMap.set(member.uid, filtered);

      // Persistir en Preferences para sobrevivir reinicios
      await Preferences.set({
        key:   `received_${groupId}_${member.uid}`,
        value: JSON.stringify(filtered),
      });
    }

    this.receivedData.set(newMap);
  }

  /**
   * Carga los datos recibidos guardados en Preferences para un grupo,
   * sin necesidad de hacer un pull de Firestore.
   */
  async loadPersistedReceived(groupId: string): Promise<void> {
    const myUid   = this.auth.user()?.uid;
    if (!myUid) return;

    const members = await this.groupSvc.getMembers(groupId);
    const others  = members.filter(m => m.uid !== myUid);
    const newMap  = new Map(this.receivedData());

    for (const member of others) {
      try {
        const { value } = await Preferences.get({ key: `received_${groupId}_${member.uid}` });
        if (value) newMap.set(member.uid, JSON.parse(value) as SharedData);
      } catch { /* ignorar */ }
    }

    this.receivedData.set(newMap);
  }

  /** Pull de todos los grupos */
  async pullFromAllGroups(): Promise<void> {
    const grupos = await this.groupSvc.getMyGroups();
    await Promise.all(grupos.map(g => this.pullFromGroup(g.id)));
  }

  /** Sync completo: push propio + pull de otros */
  async syncAll(): Promise<void> {
    await this.pushToAllGroups();
    await this.pullFromAllGroups();
  }

  /** Carga datos persistidos de TODOS los grupos del usuario */
  async loadAllPersisted(): Promise<void> {
    try {
      const { keys } = await Preferences.keys();
      const receivedKeys = keys.filter(k => k.startsWith('received_'));
      if (!receivedKeys.length) return;

      const newMap = new Map(this.receivedData());
      for (const key of receivedKeys) {
        try {
          const { value } = await Preferences.get({ key });
          if (value) {
            const data = JSON.parse(value) as SharedData;
            newMap.set(data.senderUid, data);
          }
        } catch { /* ignorar entrada corrupta */ }
      }
      this.receivedData.set(newMap);
    } catch { /* ignorar */ }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  /** Devuelve los datos recibidos de un usuario para una sección específica */
  getReceivedSection(senderUid: string, section: SyncSection): any[] | null {
    return this.receivedData().get(senderUid)?.[section] ?? null;
  }

  /**
   * Limpia una sección específica de los datos recibidos de un emisor,
   * tanto en memoria como en Preferences persistidas.
   */
  async clearSection(senderUid: string, section: SyncSection): Promise<void> {
    const newMap = new Map(this.receivedData());
    const existing = newMap.get(senderUid);
    if (existing) {
      const updated = { ...existing, [section]: null };
      newMap.set(senderUid, updated);
      this.receivedData.set(newMap);

      // Actualizar también todas las entradas persistidas de este emisor
      const { keys } = await Preferences.keys();
      const senderKeys = keys.filter(k => k.startsWith('received_') && k.endsWith(`_${senderUid}`));
      for (const key of senderKeys) {
        try {
          const { value } = await Preferences.get({ key });
          if (value) {
            const data = JSON.parse(value) as SharedData;
            data[section] = null;
            await Preferences.set({ key, value: JSON.stringify(data) });
          }
        } catch { /* ignorar */ }
      }
    }
  }

}
