import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { PersonaModel } from 'src/app/interfaces/persona.interface';
import { GastoModel } from 'src/app/interfaces/gasto.interface';

@Component({
    selector: 'app-add-gasto',
    templateUrl: './gasto.component.html',
    styleUrls: ['./gasto.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class AddGastoComponent implements OnInit {

    @Input() personas: PersonaModel[] = [];
    @Input() gastoEditar: GastoModel | null = null;

    descripcion = '';
    monto: number | null = null;
    pagadoPorId = '';
    participantesIds: Set<string> = new Set();

    divisionIgual = true;
    montosMap: Record<string, number | null> = {};

    constructor(private modalCtrl: ModalController, private toastCtrl: ToastController) { }

    ngOnInit() {
        if (this.gastoEditar) {
            this.descripcion = this.gastoEditar.descripcion;
            this.monto = this.gastoEditar.monto;
            this.pagadoPorId = this.gastoEditar.pagadoPorId;
            this.participantesIds = new Set(this.gastoEditar.participantesIds);
            if (this.gastoEditar.montosIndividuales) {
                this.divisionIgual = false;
                this.montosMap = { ...this.gastoEditar.montosIndividuales };
            } else {
                this.divisionIgual = true;
                this.initMontosMap();
            }
        } else {
            this.participantesIds = new Set(this.personas.map(p => p.id));
            if (this.personas.length) this.pagadoPorId = this.personas[0].id;
            this.initMontosMap();
        }
    }

    initMontosMap() {
        this.montosMap = {};
        this.personas.forEach(p => this.montosMap[p.id] = null);
    }

    toggleParticipante(id: string) {
        if (this.participantesIds.has(id)) {
            this.participantesIds.delete(id);
        } else {
            this.participantesIds.add(id);
        }
    }

    isParticipante(id: string): boolean { return this.participantesIds.has(id); }

    get participantes(): PersonaModel[] {
        return this.personas.filter(p => this.participantesIds.has(p.id));
    }

    get totalIndividual(): number {
        return this.participantes.reduce((sum, p) => sum + (Number(this.montosMap[p.id]) || 0), 0);
    }

    get restante(): number { return (Number(this.monto) || 0) - this.totalIndividual; }
    get restanteValido(): boolean { return Math.abs(this.restante) < 0.01; }

    cancel() { this.modalCtrl.dismiss(); }

    submitAttempted = false;

    async save() {
        this.submitAttempted = true;
        const desc = (this.descripcion || '').trim();
        const m = Number(this.monto);
        const faltantes: string[] = [];
        if (!desc) faltantes.push('Descripción');
        if (!m || m <= 0) faltantes.push('Monto');
        if (!this.pagadoPorId) faltantes.push('¿Quién pagó?');
        if (this.participantesIds.size === 0) faltantes.push('Al menos un participante');
        if (!this.divisionIgual && !this.restanteValido) faltantes.push('Los montos individuales no cierran');

        if (faltantes.length) {
            await this.mostrarError(faltantes);
            return;
        }

        let montosIndividuales: Record<string, number> | undefined;
        if (!this.divisionIgual) {
            montosIndividuales = {};
            this.participantes.forEach(p => {
                montosIndividuales![p.id] = Number(this.montosMap[p.id]) || 0;
            });
        }

        this.modalCtrl.dismiss({
            descripcion: desc,
            monto: m,
            pagadoPorId: this.pagadoPorId,
            participantesIds: Array.from(this.participantesIds),
            montosIndividuales
        });
    }

    private async mostrarError(campos: string[]) {
        const toast = await this.toastCtrl.create({
            message: `Falta completar: ${campos.join(', ')}`,
            duration: 3000,
            position: 'top',
            cssClass: 'neon-toast',
            icon: 'alert-circle-outline'
        });
        await toast.present();
    }
}
