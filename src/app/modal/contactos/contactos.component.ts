import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { ContactosService } from 'src/app/services/contactos.service';
import { PersonaModel } from 'src/app/interfaces/persona.interface';

@Component({
    selector: 'app-contactos',
    templateUrl: './contactos.component.html',
    styleUrls: ['./contactos.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class ContactosComponent implements OnInit {

    contactos: PersonaModel[] = [];
    mostrarForm = false;
    nombre = '';
    cbu = '';
    submitAttempted = false;

    constructor(
        private modalCtrl: ModalController,
        private contactosService: ContactosService,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController
    ) { }

    async ngOnInit() {
        await this.cargar();
    }

    private async cargar() {
        this.contactos = await this.contactosService.load();
    }

    cerrar() { this.modalCtrl.dismiss(); }

    toggleForm() {
        this.mostrarForm = !this.mostrarForm;
        if (!this.mostrarForm) this.resetForm();
    }

    resetForm() {
        this.nombre = '';
        this.cbu = '';
        this.submitAttempted = false;
    }

    async guardar() {
        this.submitAttempted = true;
        const n = (this.nombre || '').trim();
        if (!n) return;
        await this.contactosService.add(n, (this.cbu || '').trim() || undefined);
        await this.cargar();
        this.resetForm();
        this.mostrarForm = false;
        const toast = await this.toastCtrl.create({
            message: 'Contacto guardado',
            duration: 1500,
            position: 'top',
            cssClass: 'neon-toast'
        });
        await toast.present();
    }

    async eliminar(contacto: PersonaModel) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar contacto',
            message: `¿Querés eliminar a ${contacto.nombre}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar', role: 'destructive',
                    handler: async () => {
                        await this.contactosService.delete(contacto.id);
                        await this.cargar();
                    }
                }
            ]
        });
        await alert.present();
    }
}
