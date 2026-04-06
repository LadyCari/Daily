import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { ColorService, AppColors } from 'src/app/services/color.service';
import { ColorPickerComponent } from 'src/app/modal/color-picker/color-picker.component';

interface ColorItem { key: keyof AppColors; label: string; }
interface SubGroup  { label: string; items: ColorItem[]; }

interface Section {
  id: string;
  label: string;
  icon: string;
  groups: SubGroup[];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SettingsPage {

  colors: AppColors;
  activeSection: string | null = null;
  activeSubGroup: string | null = null;

  sections: Section[] = [
    {
      id: 'home',
      label: 'Inicio',
      icon: 'fa-house',
      groups: [
        {
          label: 'General',
          items: [
            { key: 'bgHome', label: 'Fondo' },
          ]
        },
        {
          label: 'Recordatorio',
          items: [
            { key: 'recordatorioIconColor', label: 'Ícono (papel y plus)' },
            { key: 'recordatorioTextColor', label: 'Texto' },
            { key: 'recordatorioAccent',    label: 'Borde' },
            { key: 'postit1Accent',         label: 'Nota 1' },
            { key: 'postit2Accent',         label: 'Nota 2' },
            { key: 'postit3Accent',         label: 'Nota 3' },
            { key: 'postit4Accent',         label: 'Nota 4' },
            { key: 'postitIconColor',       label: 'Ícono notas (puntos y pin)' },
          ]
        },
        {
          label: 'Horario Semanal',
          items: [
            { key: 'horarioIconColor',   label: 'Ícono (reloj, plus y trash)' },
            { key: 'horarioTextColor',   label: 'Texto' },
            { key: 'horarioAccent',      label: 'Borde' },
            { key: 'horarioDaysBg',      label: 'Fondo días' },
            { key: 'horarioDaySelected', label: 'Marcador día' },
            { key: 'horarioItemBg',      label: 'Fondo items' },
          ]
        },
        {
          label: 'Calendario',
          items: [
            { key: 'calendarioIconColor',    label: 'Íconos (calendario y plus)' },
            { key: 'calendarioAccent',       label: 'Borde' },
            { key: 'calendarioTituloColor',  label: 'Texto' },
            { key: 'homeCalSelected',        label: 'Día activo' },
            { key: 'calendarioTextColor',    label: 'Texto calendario' },
            { key: 'calendarioMesTextColor', label: 'Texto mes' },
            { key: 'calendarioNavIconColor', label: 'Íconos calendario (flechas)' },
          ]
        },
      ]
    },
    {
      id: 'tienda',
      label: 'Tienda',
      icon: 'fa-store',
      groups: [
        {
          label: 'General',
          items: [
            { key: 'bgCompras', label: 'Fondo' },
          ]
        },
        {
          label: 'Secciones',
          items: [
            { key: 'tiendaSegmentoTexto',  label: 'Texto (tiendas / productos)' },
            { key: 'tiendaSegmentoActivo', label: 'Segmento activo' },
            { key: 'tiendaSegmentoFondo',  label: 'Fondo del segmento' },
          ]
        },
        {
          label: 'Botones',
          items: [
            { key: 'tiendaBtnNueva',    label: 'Nueva tienda' },
            { key: 'tiendaBtnImportar', label: 'Importar' },
          ]
        },
      ]
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: 'fa-user',
      groups: []
    },
    {
      id: 'extra',
      label: 'Extra',
      icon: 'fa-list',
      groups: [
        {
          label: '',
          items: [
            { key: 'bgExtra', label: 'Fondo' },
          ]
        }
      ]
    },
    {
      id: 'config',
      label: 'Config',
      icon: 'fa-gear',
      groups: [
        {
          label: '',
          items: [
            { key: 'header', label: 'Header' },
            { key: 'footer', label: 'Footer' },
            { key: 'text',   label: 'Texto' },
          ]
        }
      ]
    },
  ];

  constructor(
    private colorSvc: ColorService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    this.colors = colorSvc.colors;
  }

  ionViewWillEnter() {
    this.colors = this.colorSvc.colors;
  }

  toggle(id: string) {
    this.activeSection = this.activeSection === id ? null : id;
    this.activeSubGroup = null;
  }

  toggleSubGroup(sectionId: string, groupLabel: string) {
    const key = `${sectionId}-${groupLabel}`;
    this.activeSubGroup = this.activeSubGroup === key ? null : key;
  }

  isSubGroupOpen(sectionId: string, groupLabel: string): boolean {
    return this.activeSubGroup === `${sectionId}-${groupLabel}`;
  }

  allItems(section: Section): ColorItem[] {
    return section.groups.reduce((acc: ColorItem[], g: SubGroup) => acc.concat(g.items), []);
  }

  totalItems(section: Section): number {
    return this.allItems(section).length;
  }

  async openPicker(item: ColorItem) {
    const modal = await this.modalCtrl.create({
      component: ColorPickerComponent,
      componentProps: {
        color: this.colors[item.key],
        label: item.label,
      },
      breakpoints: [0, 0.65, 1],
      initialBreakpoint: 0.65,
      handle: true,
      id: 'color-picker-modal',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      this.colorSvc.setColor(item.key, data);
      this.colors = this.colorSvc.colors;
    }
  }

  async resetColors() {
    const alert = await this.alertCtrl.create({
      header: 'Restablecer colores',
      message: '¿Volver a los colores originales?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restablecer',
          role: 'destructive',
          handler: () => {
            this.colorSvc.reset();
            this.colors = this.colorSvc.colors;
          }
        }
      ]
    });
    await alert.present();
  }
}
