import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { GastoModel } from 'src/app/interfaces/gasto.interface';
import { PersonaModel } from 'src/app/interfaces/persona.interface';

@Component({
    selector: 'app-detalle-gasto',
    templateUrl: './detalle-gasto.component.html',
    styleUrls: ['./detalle-gasto.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class DetalleGastoComponent implements OnChanges, OnInit {

    private _gasto!: GastoModel;

    @Input()
    set gasto(value: GastoModel) {
        this._gasto = value;
        if (value) this.resetEdicion();
    }
    get gasto(): GastoModel { return this._gasto; }

    @Input() personas: PersonaModel[] = [];

    // Modo
    modoEdicion = false;

    // Campos de edición (pre-cargados desde gasto)
    editDesc = '';
    editMonto: number | null = null;
    editPagadorId = '';
    editParticipantesIds: Set<string> = new Set();
    editDivisionIgual = true;
    editMontosMap: Record<string, number | null> = {};

    // Participantes en vista lectura (pre-calculado)
    participantesVista: Array<{ nombre: string; monto: number }> = [];

    constructor(private modalCtrl: ModalController) { }

    ngOnInit(): void {
        // Garantiza que recalcVista corra después de que Ionic haya
        // asignado todos los componentProps (gasto + personas)
        this.recalcVista();
    }

    ngOnChanges(): void {
        if (this._gasto && this.personas.length) {
            this.recalcVista();
        }
    }

    private resetEdicion() {
        if (!this._gasto) return;
        this.editDesc = this._gasto.descripcion;
        this.editMonto = this._gasto.monto;
        this.editPagadorId = this._gasto.pagadoPorId;
        this.editParticipantesIds = new Set(this._gasto.participantesIds);
        this.editDivisionIgual = !this._gasto.montosIndividuales;
        this.editMontosMap = {};
        this.personas.forEach(p => {
            this.editMontosMap[p.id] = this._gasto.montosIndividuales
                ? (this._gasto.montosIndividuales[p.id] ?? null)
                : null;
        });
        this.recalcVista();
    }

    private recalcVista() {
        if (!this._gasto || !this.personas.length) return; // esperar a que ambos estén listos
        this.participantesVista = this._gasto.participantesIds.map(id => ({
            nombre: this.getNombre(id),
            monto: this._gasto.montosIndividuales
                ? (this._gasto.montosIndividuales[id] ?? 0)
                : this._gasto.monto / this._gasto.participantesIds.length
        }));
    }

    // ─ Lectura ─────────────────────────────────────
    cerrar() { this.modalCtrl.dismiss(); }

    getNombre(id: string): string {
        return this.personas.find(p => p.id === id)?.nombre ?? '?';
    }

    get esDesigual(): boolean { return !!this._gasto?.montosIndividuales; }
    get pagadorNombre(): string { return this.getNombre(this._gasto?.pagadoPorId ?? ''); }

    eliminar() {
        this.modalCtrl.dismiss({ eliminado: true });
    }

    // ─ Edición ─────────────────────────────────────
    activarEdicion() { this.modoEdicion = true; }

    cancelarEdicion() {
        this.resetEdicion();
        this.modoEdicion = false;
    }

    isEditParticipante(id: string): boolean { return this.editParticipantesIds.has(id); }

    toggleEditParticipante(id: string) {
        if (this.editParticipantesIds.has(id)) {
            this.editParticipantesIds.delete(id);
        } else {
            this.editParticipantesIds.add(id);
        }
    }

    get editParticipantesLista(): PersonaModel[] {
        return this.personas.filter(p => this.editParticipantesIds.has(p.id));
    }

    get editTotalIndividual(): number {
        return this.editParticipantesLista.reduce((s, p) => s + (Number(this.editMontosMap[p.id]) || 0), 0);
    }

    get editRestante(): number { return (Number(this.editMonto) || 0) - this.editTotalIndividual; }
    get editRestanteValido(): boolean { return Math.abs(this.editRestante) < 0.01; }

    guardarEdicion() {
        const desc = (this.editDesc || '').trim();
        const m = Number(this.editMonto);
        if (!desc || !m || !this.editPagadorId || this.editParticipantesIds.size === 0) return;
        if (!this.editDivisionIgual && !this.editRestanteValido) return;

        let montosIndividuales: Record<string, number> | undefined;
        if (!this.editDivisionIgual) {
            montosIndividuales = {};
            this.editParticipantesLista.forEach(p => {
                montosIndividuales![p.id] = Number(this.editMontosMap[p.id]) || 0;
            });
        }

        const gastoEditado: GastoModel = {
            ...this._gasto,
            descripcion: desc,
            monto: m,
            pagadoPorId: this.editPagadorId,
            participantesIds: Array.from(this.editParticipantesIds),
            montosIndividuales
        };

        this.modalCtrl.dismiss({ gastoEditado });
    }
}
