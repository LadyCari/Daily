import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { AppNotification } from '../interfaces/notification.interface';
import { Invitation } from '../interfaces/grupo.interface';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private fs   = inject(FirestoreService);
  private auth = inject(AuthService);

  private _firestoreNotifs   = signal<AppNotification[]>([]);
  private _pendingInvites    = signal<Invitation[]>([]);
  private _calendarReminders = signal<AppNotification[]>([]);

  /** Todas las notificaciones unificadas, ordenadas por fecha descendente */
  readonly all = computed<AppNotification[]>(() => {
    const inviteNotifs: AppNotification[] = this._pendingInvites().map(inv => ({
      id:          `inv_${inv.id}`,
      toUid:       '',
      type:        'group_invite' as const,
      title:       'Invitación a grupo',
      body:        `${inv.fromName} te invitó al grupo "${inv.groupName}"`,
      groupId:     inv.groupId,
      groupName:   inv.groupName,
      senderName:  inv.fromName,
      read:        false,
      createdAt:   inv.createdAt,
    }));

    return [
      ...this._calendarReminders(),
      ...inviteNotifs,
      ...this._firestoreNotifs(),
    ].sort((a, b) => b.createdAt - a.createdAt);
  });

  /** Cantidad de notificaciones sin leer */
  readonly unreadCount = computed(() => this.all().filter(n => !n.read).length);

  /** Invitaciones pendientes originales (para aceptar/rechazar) */
  readonly pendingInvitations = this._pendingInvites.asReadonly();

  private unsubNotifs?:  () => void;
  private unsubInvites?: () => void;
  private listening = false;

  constructor() {
    // Arranca a escuchar automáticamente cuando el usuario inicia sesión
    effect(() => {
      const user = this.auth.user();
      if (user && !this.listening) {
        this.startListening(user.uid, user.email);
      } else if (!user && this.listening) {
        this.stopListening();
      }
    });
  }

  // ── Listeners en tiempo real ────────────────────────────────────────────────

  private startListening(uid: string, email: string): void {
    this.listening = true;

    this.unsubNotifs = this.fs.listenWhere<AppNotification>(
      'notifications', 'toUid', '==', uid,
      docs => this._firestoreNotifs.set(docs)
    );

    this.unsubInvites = this.fs.listenWhere<Invitation>(
      'invitations', 'toEmail', '==', email.toLowerCase(),
      docs => this._pendingInvites.set(docs.filter(i => i.status === 'pending'))
    );
  }

  private stopListening(): void {
    this.unsubNotifs?.();
    this.unsubInvites?.();
    this.listening = false;
    this._firestoreNotifs.set([]);
    this._pendingInvites.set([]);
    this._calendarReminders.set([]);
  }

  // ── Recordatorios de calendario (locales) ──────────────────────────────────

  setCalendarReminders(reminders: AppNotification[]): void {
    this._calendarReminders.set(reminders);
  }

  // ── Escritura de notificaciones ────────────────────────────────────────────

  /**
   * Crea/actualiza la notificación de sync para un miembro del grupo.
   * Usa un ID fijo para evitar duplicados si el partner pushea varias veces.
   */
  async addPartnerSyncNotif(
    toUid:     string,
    senderUid: string,
    senderName: string,
    groupId:   string,
    groupName: string
  ): Promise<void> {
    const docId = `sync_${groupId}_${senderUid}_${toUid}`;
    await this.fs.setDoc(`notifications/${docId}`, {
      toUid,
      type:       'partner_sync',
      title:      'Cambios recibidos',
      body:       `${senderName} compartió cambios en "${groupName}"`,
      groupId,
      groupName,
      senderName,
      read:       false,
      createdAt:  Date.now(),
    });
  }

  // ── Marcar como leída ──────────────────────────────────────────────────────

  async markRead(notifId: string): Promise<void> {
    if (notifId.startsWith('cal_')) {
      this._calendarReminders.update(list =>
        list.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
      return;
    }
    if (notifId.startsWith('inv_')) return; // las invitaciones se resuelven aceptando/rechazando
    await this.fs.setDoc(`notifications/${notifId}`, { read: true });
  }

  async markAllRead(): Promise<void> {
    const unread = this._firestoreNotifs().filter(n => !n.read);
    await Promise.all(unread.map(n => this.fs.setDoc(`notifications/${n.id}`, { read: true })));
    this._calendarReminders.update(list => list.map(n => ({ ...n, read: true })));
  }
}
