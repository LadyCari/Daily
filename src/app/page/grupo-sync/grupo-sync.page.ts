import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';
import { InvitationService } from 'src/app/services/invitation.service';
import { SubscriptionService } from 'src/app/services/subscription.service';
import { SyncService } from 'src/app/services/sync.service';
import { LinkedTiendaService } from 'src/app/services/linked-tienda.service';
import { LinkedFormService } from 'src/app/services/linked-form.service';
import {
  Grupo, GrupoMember, Subscription, SharedData,
  SyncSection, ALL_SECTIONS,
  SYNC_SECTION_LABELS, SYNC_SECTION_ICONS
} from 'src/app/interfaces/grupo.interface';

interface MemberVM {
  member:   GrupoMember;
  sub:      Subscription;
  received: SharedData | null;
  expanded: boolean;
}

@Component({
  selector: 'app-grupo-sync',
  templateUrl: './grupo-sync.page.html',
  styleUrls: ['./grupo-sync.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class GrupoSyncPage implements OnInit {

  groupId!: string;
  grupo: Grupo | null = null;
  myUid = '';
  members: MemberVM[] = [];
  loading   = false;
  syncing   = false;
  lastSync: number | null = null;

  readonly sections   = ALL_SECTIONS;
  readonly labels     = SYNC_SECTION_LABELS;
  readonly icons      = SYNC_SECTION_ICONS;

  constructor(
    public  authSvc:          AuthService,
    private groupSvc:         GroupService,
    private inviteSvc:        InvitationService,
    private subSvc:           SubscriptionService,
    private syncSvc:          SyncService,
    private linkedTiendaSvc:  LinkedTiendaService,
    private linkedFormSvc:    LinkedFormService,
    private route:            ActivatedRoute,
    private router:           Router,
    private alertCtrl:        AlertController,
    private toastCtrl:        ToastController,
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id') ?? '';
    this.myUid   = this.authSvc.user()?.uid ?? '';
  }

  async ionViewWillEnter() {
    await this.load();
  }

  async load() {
    if (!this.groupId) return;
    this.loading = true;
    try {
      this.grupo = await this.groupSvc.getGroup(this.groupId);

      // Cargar datos persistidos antes de mostrar
      await this.syncSvc.loadPersistedReceived(this.groupId);

      const allMembers = await this.groupSvc.getMembers(this.groupId);
      const others     = allMembers.filter(m => m.uid !== this.myUid);

      this.members = await Promise.all(
        others.map(async (member) => ({
          member,
          sub:      await this.subSvc.getMySub(this.groupId, member.uid),
          received: this.syncSvc.receivedData().get(member.uid) ?? null,
          expanded: false,
        }))
      );
    } finally {
      this.loading = false;
    }
  }

  async toggleSection(vm: MemberVM, section: SyncSection) {
    const newValue = !vm.sub[section];
    vm.sub[section] = newValue;
    try {
      await this.subSvc.saveSub(vm.sub);
      if (!newValue) {
        await this.syncSvc.clearSection(vm.member.uid, section);
        vm.received = this.syncSvc.receivedData().get(vm.member.uid) ?? null;
      }
    } catch (e: any) {
      vm.sub[section] = !newValue; // revertir en caso de error
      await this.showToast('❌ Error al guardar', 'danger');
    }
  }

  async sincronizar() {
    this.syncing = true;
    let bulkError = false;
    let tiendaErrors = 0;
    let formErrors = 0;
    let tiendasNuevas = 0;
    let formsNuevos = 0;

    try {
      // Sync general (bulk push/pull) — independiente del sync vinculado
      try {
        await this.syncSvc.pushToGroup(this.groupId);
        await this.syncSvc.pullFromGroup(this.groupId);
        // Actualizar datos recibidos en los ViewModels
        for (const vm of this.members) {
          vm.received = this.syncSvc.receivedData().get(vm.member.uid) ?? null;
        }
      } catch {
        bulkError = true;
      }

      // Sync tiendas vinculadas (bidireccional, por item)
      tiendaErrors  = await this.linkedTiendaSvc.syncAllLinked();
      tiendasNuevas = await this.linkedTiendaSvc.receiveTiendasFromGroup(this.groupId);

      // Sync forms vinculados (bidireccional, por item)
      formErrors  = await this.linkedFormSvc.syncAllLinked();
      formsNuevos = await this.linkedFormSvc.receiveFormsFromGroup(this.groupId);

      this.lastSync = Date.now();

      const totalErrors = tiendaErrors + formErrors + (bulkError ? 1 : 0);
      const totalNuevos = tiendasNuevas + formsNuevos;
      if (totalErrors > 0) {
        await this.showToast(`⚠️ Sync completado con ${totalErrors} error(es)`, 'warning');
      } else if (totalNuevos > 0) {
        await this.showToast(`✅ Sincronizado · ${totalNuevos} nuevo(s) recibido(s)`);
      } else {
        await this.showToast('✅ Sincronización completada');
      }
    } catch (e: any) {
      await this.showToast('❌ ' + (e?.message ?? 'Error al sincronizar'), 'danger');
    } finally {
      this.syncing = false;
    }
  }

  toggleExpanded(vm: MemberVM) {
    vm.expanded = !vm.expanded;
  }

  /** Cuenta ítems de una sección recibida */
  countReceived(vm: MemberVM, section: SyncSection): number {
    const data = vm.received?.[section];
    return Array.isArray(data) ? data.length : 0;
  }

  /** Secciones que tienen datos recibidos Y están suscriptas */
  activeSectionsWithData(vm: MemberVM): SyncSection[] {
    return ALL_SECTIONS.filter(s => vm.sub[s] && Array.isArray(vm.received?.[s]) && (vm.received![s] as any[]).length > 0);
  }


  async invitarPersona() {
    const alert = await this.alertCtrl.create({
      header: 'Invitar al grupo',
      inputs: [{ name: 'email', type: 'email', placeholder: 'email@ejemplo.com' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Invitar',
          handler: async (data) => {
            const email = data.email?.trim();
            if (!email) return false;
            try {
              await this.inviteSvc.sendInvitation(this.groupId, this.grupo?.name ?? '', email);
              await this.showToast('✅ Invitación enviada a ' + email);
            } catch (e: any) {
              await this.showToast('❌ ' + (e?.message ?? 'Error'), 'danger');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmarSalir() {
    const alert = await this.alertCtrl.create({
      header: 'Salir del grupo',
      message: '¿Seguro que querés abandonar este grupo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: async () => {
            await this.groupSvc.leaveGroup(this.groupId);
            this.router.navigate(['/grupos']);
          }
        }
      ]
    });
    await alert.present();
  }

  volver() {
    this.router.navigate(['/grupos']);
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
