import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';
import { App } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ToastController } from '@ionic/angular';
import { TarjetaTienda } from './services/tarjeta-tienda.service';
import { CustomFormsService } from './services/custom-forms.service';
import { NotificationService } from './services/notification.service';
import { EventoCalendarioService } from './services/evento-calendario.service';
import { LocalNotificationService } from './services/local-notification.service';
import { AppNotification } from './interfaces/notification.interface';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const _fbApp = initializeApp({
  apiKey: 'AIzaSyDApsBZcWN55qYNtneWO9q7XgUpWXvElBM',
  authDomain: 'daily-491100.firebaseapp.com',
  projectId: 'daily-491100',
  storageBucket: 'daily-491100.firebasestorage.app',
  messagingSenderId: '484063295309',
  appId: '1:484063295309:web:af4d776323c3f5913ee904'
});
// Inicializar Firestore con ignoreUndefinedProperties para evitar errores
// cuando campos opcionales (accentColor, iconColor, etc.) sean undefined
initializeFirestore(_fbApp, { ignoreUndefinedProperties: true });

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private theme: ThemeService,
    private toastCtrl: ToastController,
    private tarjetaSvc: TarjetaTienda,
    private formsSvc: CustomFormsService,
    private notifSvc: NotificationService,
    private eventoSvc: EventoCalendarioService,
    private localNotif: LocalNotificationService
  ) {}

  ngOnInit() {
    // Chequear al arrancar (cold start o cuando vuelve al frente)
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) this.checkPendingImport();
    });

    setTimeout(() => this.checkPendingImport(), 800);
    setTimeout(() => this.checkCalendarReminders(), 1200);
    setTimeout(() => this.restoreLocalNotifications(), 2000);
  }

  private async checkCalendarReminders(): Promise<void> {
    try {
      const today    = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr    = today.toISOString().slice(0, 10);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const eventos = await this.eventoSvc.loadAll();
      const reminders: AppNotification[] = [];

      for (const ev of eventos) {
        if (ev.fecha === todayStr || ev.fecha === tomorrowStr) {
          const label = ev.fecha === todayStr ? 'Hoy' : 'Mañana';
          reminders.push({
            id:        `cal_${ev.id}`,
            toUid:     '',
            type:      'calendar_reminder',
            title:     `Evento ${label.toLowerCase()}`,
            body:      `${ev.titulo} a las ${ev.hora}`,
            read:      false,
            createdAt: Date.now(),
          });
        }
      }

      this.notifSvc.setCalendarReminders(reminders);
    } catch { /* ignorar */ }
  }

  private async restoreLocalNotifications(): Promise<void> {
    try {
      const eventos = await this.eventoSvc.loadAll();
      await this.localNotif.scheduleAll(eventos);
    } catch { /* ignorar */ }
  }

  private async checkPendingImport() {
    try {
      const result = await Filesystem.readFile({
        path: 'pending_import.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      const json = result.data as string;
      if (!json?.trim()) return;

      // Borrar el archivo para no reimportar
      await Filesystem.deleteFile({ path: 'pending_import.json', directory: Directory.Data });

      await this.importJson(json);
    } catch {
      // No hay archivo pendiente, es normal
    }
  }

  private async importJson(json: string) {
    try {
      const payload = JSON.parse(json);
      if (payload?.tienda) {
        await this.tarjetaSvc.importTiendaFromJson(json);
        await this.showToast('✅ Tienda importada correctamente');
      } else if (payload?.form) {
        await this.formsSvc.importFormFromJson(json);
        await this.showToast('✅ Form importado correctamente');
      } else {
        await this.showToast('❌ Archivo no reconocido', 'danger');
      }
    } catch {
      await this.showToast('❌ Error al importar el archivo', 'danger');
    }
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
