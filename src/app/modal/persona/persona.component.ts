import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ContactosService } from 'src/app/services/contactos.service';
import { PersonaModel } from 'src/app/interfaces/persona.interface';

@Component({
    selector: 'app-add-persona',
    templateUrl: './persona.component.html',
    styleUrls: ['./persona.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class AddPersonaComponent implements OnInit {
    @Input() showSaveToContacts = false;
    /** Nombres ya en el grupo, para no mostrar esos contactos */
    @Input() existingNombres: string[] = [];

    contactosDisponibles: PersonaModel[] = [];

    nombre = '';
    cbu = '';
    saveToContacts = false;
    submitAttempted = false;

    constructor(
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
        private contactosService: ContactosService
    ) { }

    async ngOnInit() {
        const todos = await this.contactosService.load();
        const existSet = new Set(this.existingNombres.map(n => n.toLowerCase()));
        this.contactosDisponibles = todos.filter(c => !existSet.has(c.nombre.toLowerCase()));
    }

    seleccionarContacto(event: Event) {
        const id = (event.target as HTMLSelectElement).value;
        if (!id) return;
        const c = this.contactosDisponibles.find(x => x.id === id);
        if (!c) return;
        this.modalCtrl.dismiss({ nombre: c.nombre, cbu: c.cbu, saveToContacts: false });
    }

    cancel() { this.modalCtrl.dismiss(); }

    async save() {
        this.submitAttempted = true;
        const n = (this.nombre || '').trim();
        if (!n) {
            await this.mostrarError(['Nombre']);
            return;
        }
        const c = (this.cbu || '').trim();
        this.modalCtrl.dismiss({ nombre: n, ...(c ? { cbu: c } : {}), saveToContacts: this.saveToContacts });
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
