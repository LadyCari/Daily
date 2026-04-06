import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';
import { InvitationService } from 'src/app/services/invitation.service';
import { Grupo, Invitation } from 'src/app/interfaces/grupo.interface';

@Component({
  selector: 'app-grupos',
  templateUrl: './grupos.page.html',
  styleUrls: ['./grupos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class GruposPage implements OnInit {

  grupos: Grupo[] = [];
  invitaciones: Invitation[] = [];
  loading = false;

  constructor(
    public  authSvc:   AuthService,
    private groupSvc:  GroupService,
    private inviteSvc: InvitationService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router:    Router,
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    await this.load();
  }

  async load() {
    if (!this.authSvc.user()) return;
    this.loading = true;
    try {
      const [grupos, invitaciones] = await Promise.all([
        this.groupSvc.getMyGroups(),
        this.inviteSvc.getMyPendingInvitations(),
      ]);
      this.grupos      = grupos;
      this.invitaciones = invitaciones;
    } finally {
      this.loading = false;
    }
  }

  goToGroup(id: string) {
    this.router.navigate(['/grupos', id]);
  }

  async crearGrupo() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo grupo',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Nombre del grupo' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            const name = data.name?.trim();
            if (!name) return false;
            try {
              const id = await this.groupSvc.createGroup(name);
              await this.load();
              this.router.navigate(['/grupos', id]);
            } catch (e: any) {
              await this.showToast('❌ ' + (e?.message ?? 'Error al crear'), 'danger');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async aceptarInvitacion(inv: Invitation) {
    try {
      await this.inviteSvc.acceptInvitation(inv);
      await this.showToast('✅ Te uniste a ' + inv.groupName);
      await this.load();
    } catch (e: any) {
      await this.showToast('❌ ' + (e?.message ?? 'Error'), 'danger');
    }
  }

  async rechazarInvitacion(inv: Invitation) {
    await this.inviteSvc.rejectInvitation(inv.id);
    await this.load();
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
