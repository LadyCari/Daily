import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { EventoCalendarioModel } from '../interfaces/evento-calendario.interface';

@Injectable({ providedIn: 'root' })
export class LocalNotificationService {

  private permissionGranted: boolean | null = null;

  private async checkPermission(): Promise<boolean> {
    if (this.permissionGranted !== null) return this.permissionGranted;
    const { display } = await LocalNotifications.requestPermissions();
    this.permissionGranted = display === 'granted';
    return this.permissionGranted;
  }

  /** Convierte el ID string del evento a número válido para la notif */
  private toNotifId(eventId: string): number {
    return Math.abs(parseInt(eventId, 10) % 2_000_000_000) || 1;
  }

  /** Programa una notificación para un evento (se dispara en la hora exacta del evento) */
  async scheduleForEvent(event: EventoCalendarioModel): Promise<void> {
    if (!(await this.checkPermission())) return;

    const [year, month, day] = event.fecha.split('-').map(Number);
    const [hour, minute]     = event.hora.split(':').map(Number);
    const at = new Date(year, month - 1, day, hour, minute, 0);

    if (at <= new Date()) return; // no programar eventos pasados

    await LocalNotifications.schedule({
      notifications: [{
        id:    this.toNotifId(event.id),
        title: event.titulo,
        body:  `Hoy a las ${event.hora}${event.descripcion ? ' · ' + event.descripcion : ''}`,
        schedule: { at, allowWhileIdle: true },
      }],
    });
  }

  /** Cancela la notificación de un evento */
  async cancelForEvent(eventId: string): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: this.toNotifId(eventId) }],
      });
    } catch { /* ignorar si no existía */ }
  }

  /** Cancela la notif anterior y programa la nueva (al editar un evento) */
  async rescheduleForEvent(event: EventoCalendarioModel): Promise<void> {
    await this.cancelForEvent(event.id);
    await this.scheduleForEvent(event);
  }

  /**
   * Programa notificaciones para todos los eventos futuros.
   * Llamar al iniciar la app para restaurar las notifs después de un reinicio.
   */
  async scheduleAll(events: EventoCalendarioModel[]): Promise<void> {
    for (const ev of events) {
      await this.scheduleForEvent(ev);
    }
  }
}
