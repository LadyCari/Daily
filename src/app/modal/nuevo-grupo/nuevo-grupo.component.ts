import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CategoriaGrupo } from 'src/app/interfaces/grupo-gasto.interface';

interface CatOption {
    value: CategoriaGrupo;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-nuevo-grupo',
    templateUrl: './nuevo-grupo.component.html',
    styleUrls: ['./nuevo-grupo.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class NuevoGrupoComponent {

    titulo = '';
    categoria: CategoriaGrupo = 'general';

    readonly categorias: CatOption[] = [
        { value: 'general', label: 'General', icon: 'fa-layer-group' },
        { value: 'regalo', label: 'Regalo', icon: 'fa-gift' },
        { value: 'cuentas', label: 'Cuentas', icon: 'fa-file-invoice' },
        { value: 'otros', label: 'Otros', icon: 'fa-ellipsis' }
    ];

    constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

    cancel() { this.modalCtrl.dismiss(); }

    submitAttempted = false;

    async save() {
        this.submitAttempted = true;
        const t = this.titulo.trim();
        if (!t) {
            await this.mostrarError(['Título del grupo']);
            return;
        }
        this.modalCtrl.dismiss({ titulo: t, categoria: this.categoria });
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
