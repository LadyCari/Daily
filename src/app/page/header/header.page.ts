import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonButton, IonButtons,
  IonModal, IonSegment, IonSegmentButton, IonLabel,
  IonContent, IonList, IonItem, IonListHeader,
  ToastController,
} from '@ionic/angular/standalone';
import { ColorService, AppColors } from 'src/app/services/color.service';
import { NotificationService } from 'src/app/services/notification.service';
import { InvitationService } from 'src/app/services/invitation.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppNotification } from 'src/app/interfaces/notification.interface';
import { Invitation } from 'src/app/interfaces/grupo.interface';
import { computed } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: '../header/header.page.html',
  styleUrls: ['../header/header.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButton, IonButtons,
    IonModal, IonSegment, IonSegmentButton, IonLabel,
    IonContent, IonList, IonItem, IonListHeader,
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {

  titleText    = '';
  pageIcon     = 'fa-house';
  showSettings = true;
  settingsOpen = false;
  settingsTab: 'home' | 'extra' | 'compras' = 'home';
  colors!: AppColors;

  notifsOpen = false;

  private sub?: Subscription;

  readonly profileImage = computed(() => this.authSvc.user()?.imageUrl ?? null);

  constructor(
    private router: Router,
    private colorSvc: ColorService,
    public  notifSvc: NotificationService,
    private inviteSvc: InvitationService,
    private authSvc: AuthService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.colors = this.colorSvc.colors;
    this.updateFromUrl(this.router.url);
    this.sub = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.updateFromUrl(evt.urlAfterRedirects);
      }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  openNotifs() {
    this.notifsOpen = true;
    this.notifSvc.markAllRead();
  }

  async acceptInvite(inv: Invitation): Promise<void> {
    try {
      await this.inviteSvc.acceptInvitation(inv);
      await this.showToast('✅ Te uniste al grupo "' + inv.groupName + '"');
    } catch (e: any) {
      await this.showToast('❌ ' + (e?.message ?? 'Error'), 'danger');
    }
  }

  async rejectInvite(inv: Invitation): Promise<void> {
    try {
      await this.inviteSvc.rejectInvitation(inv.id);
      await this.showToast('Invitación rechazada');
    } catch {
      await this.showToast('❌ Error al rechazar', 'danger');
    }
  }

  notifIcon(type: AppNotification['type']): string {
    const icons: Record<AppNotification['type'], string> = {
      group_invite:      'fa-users',
      partner_sync:      'fa-arrows-rotate',
      calendar_reminder: 'fa-calendar-day',
    };
    return icons[type];
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const hs = Math.floor(min / 60);
    if (hs < 24)  return `hace ${hs} h`;
    return `hace ${Math.floor(hs / 24)} d`;
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }

  openSettings() {
    this.colors = this.colorSvc.colors;
    // Open on the tab matching current section
    const url = this.router.url;
    if (url.includes('/extra')) this.settingsTab = 'extra';
    else if (url.includes('/compra')) this.settingsTab = 'compras';
    else this.settingsTab = 'home';
    this.settingsOpen = true;
  }

  onColorChange(key: keyof AppColors, value: string) {
    this.colors = { ...this.colors, [key]: value };
    this.colorSvc.setColor(key, value);
  }

  resetColors() {
    this.colorSvc.reset();
    this.colors = this.colorSvc.colors;
  }

  /**
   * Map URL → { label, icon, settingsTab }
   * Priority: check full URL substrings so /compra/tiendas
   * is matched before a generic segment check.
   */
  private updateFromUrl(url: string) {
    if (url.includes('/compra')) {
      this.titleText = 'Tienda';
      this.pageIcon = 'fa-store';
      this.showSettings = true;
    } else if (url.includes('/extra')) {
      this.titleText = 'Extras';
      this.pageIcon = 'fa-list';
      this.showSettings = true;
    } else if (url.includes('/gastos')) {
      this.titleText = 'Gastos';
      this.pageIcon = 'fa-wallet';
      this.showSettings = false;
    } else if (url.includes('/forms')) {
      this.titleText = 'Forms';
      this.pageIcon = 'fa-clipboard-list';
      this.showSettings = false;
    } else {
      // default → home
      this.titleText = 'Home';
      this.pageIcon = 'fa-house';
      this.showSettings = true;
    }
  }
}