import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.page';
import { CustomFormsService } from 'src/app/services/custom-forms.service';
import { CustomForm } from 'src/app/interfaces/custom-form.interface';
import { ShareService } from 'src/app/services/share.service';

@Component({
  selector: 'app-forms',
  templateUrl: './forms.page.html',
  styleUrls: ['./forms.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, DragDropModule]
})
export class FormsPage implements OnInit, OnDestroy {
  forms: CustomForm[] = [];
  formsRecibidos: { items: any[]; senderName: string; senderUid: string }[] = [];
  private importSub?: Subscription;

  constructor(
    private customForms: CustomFormsService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private shareSvc: ShareService,
  ) { }

  ngOnInit() {
    this.importSub = this.customForms.imported$.subscribe(() => this.load());
  }

  ngOnDestroy() { this.importSub?.unsubscribe(); }

  async ionViewWillEnter() {
    await this.load();
    this.formsRecibidos = [];
  }

  abrirFormCompartido(form: any, senderName: string) {
    this.router.navigate(['/forms-shared'], { state: { form, senderName } });
  }

  goBack() {
    this.router.navigate(['/extra']);
  }

  private async load() {
    this.forms = await this.customForms.loadAll();
  }

  async onReorder(event: CdkDragDrop<CustomForm[]>) {
    moveItemInArray(this.forms, event.previousIndex, event.currentIndex);
    await this.customForms.reorderForms(this.forms);
  }

  openForm(id: string) {
    this.router.navigate(['/forms', id]);
  }

  async createForm() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo form',
      inputs: [{ name: 'title', type: 'text', placeholder: 'Título' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data: any) => {
            const title = (data?.title ?? '').trim();
            if (!title) {
              const t = await this.toastCtrl.create({ message: 'Ingresá un título', duration: 1500, position: 'top' });
              await t.present();
              return false;
            }
            const form = await this.customForms.createForm(title);
            await this.load();
            this.openForm(form.id);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteForm(form: CustomForm) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar form',
      message: `¿Eliminar "${form.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.customForms.deleteForm(form.id);
            await this.load();
          }
        }
      ]
    });
    await alert.present();
  }

  async exportarForm(form: CustomForm) {
    try {
      const { filename, json } = await this.customForms.exportFormData(form.id);
      await this.shareSvc.shareFile(filename, json, form.title);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const t = await this.toastCtrl.create({ message: 'Error al exportar', duration: 2000, color: 'danger' });
        await t.present();
      }
    }
  }

  async importarForm() {
    try {
      const json = await this.shareSvc.readFile();
      await this.customForms.importFormFromJson(json);
      await this.load();
      const t = await this.toastCtrl.create({ message: '✅ Form importado correctamente', duration: 2000, color: 'success' });
      await t.present();
    } catch (e: any) {
      if (e?.message === 'Cancelado') return;
      const t = await this.toastCtrl.create({ message: '❌ Archivo inválido', duration: 2500, color: 'danger' });
      await t.present();
    }
  }
}
