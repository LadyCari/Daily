import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { CategoriaEvento } from 'src/app/interfaces/categoria-evento.enum';
import { CategoriaEventoInfo } from 'src/app/interfaces/categoria-evento-info.enum';

@Component({
    selector: 'app-add-evento',
    templateUrl: './evento.component.html',
    styleUrls: ['./evento.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class AddEventoComponent implements OnInit {

    @Input() eventoEditar?: { id: string; titulo: string; tipo: CategoriaEvento; hora: string; fecha: string; descripcion?: string; };
    @Input() fechaPreset?: string;

    titulo = '';
    tipo: CategoriaEvento = CategoriaEvento.MEDICO;
    hora = '09:00';
    fecha = new Date().toISOString().split('T')[0];
    descripcion = '';
    repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'none';
    repeatDuration?: number;
    isPrivate = false;

    categorias = Object.values(CategoriaEvento);
    categoriaInfo = CategoriaEventoInfo;
    CategoriaEvento = CategoriaEvento;

    constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

    ngOnInit() {
        if (this.eventoEditar) {
            this.titulo = this.eventoEditar.titulo;
            this.tipo = this.eventoEditar.tipo;
            this.hora = this.eventoEditar.hora;
            this.fecha = this.eventoEditar.fecha;
            this.descripcion = this.eventoEditar.descripcion ?? '';
            this.repeat = (this.eventoEditar as any).repeat ?? 'none';
            this.repeatDuration = (this.eventoEditar as any).repeatDuration;
        } else if (this.fechaPreset) {
            this.fecha = this.fechaPreset;
        }
    }

    getLabel(cat: CategoriaEvento): string { return this.categoriaInfo[cat]?.label ?? cat; }
    getIcono(cat: CategoriaEvento): string { return this.categoriaInfo[cat]?.icono ?? 'fa-star'; }
    getColor(cat: CategoriaEvento): string { return this.categoriaInfo[cat]?.color ?? '#fff'; }

    cancel() { this.modalCtrl.dismiss(); }

    submitAttempted = false;

    async save() {
        this.submitAttempted = true;
        const t = (this.titulo || '').trim();
        const faltantes: string[] = [];
        if (!t) faltantes.push('Nombre del evento');
        if (!this.fecha) faltantes.push('Fecha');
        if (!this.hora) faltantes.push('Hora');
        if (faltantes.length) {
            await this.mostrarError(faltantes);
            return;
        }
        this.modalCtrl.dismiss({
            id: this.eventoEditar?.id,
            titulo: t,
            tipo: this.tipo,
            hora: this.hora,
            fecha: this.fecha,
            descripcion: (this.descripcion || '').trim() || undefined,
            repeat: this.repeat,
            repeatDuration: this.repeat !== 'none' && this.repeatDuration && this.repeatDuration > 0 ? this.repeatDuration : undefined,
            isPrivate: this.isPrivate
        });
    }

    private async mostrarError(campos: string[]) {
        const toast = await this.toastCtrl.create({
            message: `Falta completar: ${campos.join(', ')}`,
            duration: 2500,
            position: 'top',
            cssClass: 'neon-toast',
            icon: 'alert-circle-outline'
        });
        await toast.present();
    }
}
