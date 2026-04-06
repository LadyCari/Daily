import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { BackupService } from 'src/app/services/backup.service';
import { ShareService } from 'src/app/services/share.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class PerfilPage {

  avatarError = false;

  constructor(
    public authSvc: AuthService,
    private backupSvc: BackupService,
    private shareSvc: ShareService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
  ) { }

  goToGrupos() {
    this.router.navigate(['/grupos']);
  }

  async signIn() {
    try {
      await this.authSvc.signIn();
    } catch (e: any) {
      const t = await this.toastCtrl.create({
        message: '❌ Error al iniciar sesión: ' + (e?.message ?? 'Error desconocido'),
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
      await t.present();
    }
  }

  async signOut() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Querés cerrar sesión de Google?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sesión', role: 'destructive', handler: () => this.authSvc.signOut() }
      ]
    });
    await alert.present();
  }

  async exportarAlDrive(retry = true): Promise<void> {
    try {
      const token = await this.authSvc.getAccessToken();
      const filename = await this.backupSvc.exportToDrive(token);
      const t = await this.toastCtrl.create({
        message: `✅ Guardado en Drive: ${filename}`,
        duration: 4000,
        color: 'success',
        position: 'top',
      });
      await t.present();
    } catch (e: any) {
      const errorMsg = e?.message ?? 'Error al subir a Drive';
      
      // Si el error es de autenticación o scopes, y es el primer intento, forzamos re-login
      if (retry && (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('No se pudo obtener el token'))) {
        try {
          const t1 = await this.toastCtrl.create({ message: 'Renovando permisos de Drive...', duration: 2000 });
          await t1.present();
          await this.authSvc.signIn();
          return this.exportarAlDrive(false); // second try
        } catch (signInErr) {
          const t = await this.toastCtrl.create({ message: '❌ No se pudo renovar el acceso a Drive', duration: 4000, color: 'danger', position: 'top' });
          await t.present();
          return;
        }
      }

      const t = await this.toastCtrl.create({
        message: '❌ ' + errorMsg,
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
      await t.present();
    }
  }

  async exportarCompartir() {
    try {
      await this.backupSvc.exportAll();
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const t = await this.toastCtrl.create({ message: 'Error al exportar', duration: 2000, color: 'danger' });
      await t.present();
    }
  }

  async importarDesdeDrive(retry = true): Promise<void> {
    try {
      const token = await this.authSvc.getAccessToken();
      const backups = await this.backupSvc.listDriveBackups(token);

      if (!backups.length) {
        const t = await this.toastCtrl.create({ message: 'No encontré respaldos en tu Drive', duration: 2500 });
        await t.present();
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Elegí un respaldo',
        inputs: backups.map(b => ({
          type: 'radio' as const,
          label: `${b.name} (${b.date})`,
          value: b.id,
        })),
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Restaurar',
            handler: async (fileId: string) => {
              if (!fileId) return false;
              const confirm = await this.alertCtrl.create({
                header: 'Confirmar restauración',
                message: 'Esto reemplazará TODA tu información actual. ¿Continuar?',
                buttons: [
                  { text: 'Cancelar', role: 'cancel' },
                  {
                    text: 'Restaurar',
                    role: 'destructive',
                    handler: async () => {
                      try {
                        await this.backupSvc.importFromDrive(token, fileId);
                        const t = await this.toastCtrl.create({
                          message: '✅ Respaldo restaurado. Reiniciá la app.',
                          duration: 3500,
                          color: 'success'
                        });
                        await t.present();
                      } catch (e: any) {
                        const t = await this.toastCtrl.create({
                          message: '❌ ' + (e?.message ?? 'Error al restaurar'),
                          duration: 2500,
                          color: 'danger'
                        });
                        await t.present();
                      }
                    }
                  }
                ]
              });
              await confirm.present();
              return true;
            }
          }
        ]
      });
      await alert.present();

    } catch (e: any) {
      const msg = e?.message ?? 'Error';
      if (retry && (msg.includes('401') || msg.includes('403'))) {
        try {
          await this.authSvc.signIn();
          return this.importarDesdeDrive(false);
        } catch { /* ignorar */ }
      }
      const t = await this.toastCtrl.create({ message: '❌ ' + msg, duration: 2500, color: 'danger' });
      await t.present();
    }
  }

  async importarTodo() {
    const alert = await this.alertCtrl.create({
      header: 'Importar respaldo',
      message: 'Esto va a reemplazar TODA tu información actual. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Importar',
          role: 'destructive',
          handler: async () => {
            try {
              const json = await this.shareSvc.readFile();
              await this.backupSvc.importAll(json);
              const t = await this.toastCtrl.create({
                message: '✅ Respaldo restaurado. Reiniciá la app.',
                duration: 3500,
                color: 'success'
              });
              await t.present();
            } catch (e: any) {
              if (e?.message === 'Cancelado') return;
              const t = await this.toastCtrl.create({
                message: '❌ ' + (e?.message ?? 'Archivo inválido'),
                duration: 2500,
                color: 'danger'
              });
              await t.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
