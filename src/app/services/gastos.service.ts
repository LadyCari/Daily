import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { PersonaModel } from '../interfaces/persona.interface';
import { GastoModel } from '../interfaces/gasto.interface';
import { GrupoGastoModel } from '../interfaces/grupo-gasto.interface';

@Injectable({ providedIn: 'root' })
export class GastosService {

    private readonly GRUPOS_KEY = 'grupos_gastos';

    private grupos: GrupoGastoModel[] = [];

    constructor(private storage: StorageService) { }

    // ── Grupos ───────────────────────────────────────
    async loadGrupos(): Promise<GrupoGastoModel[]> {
        const stored = await this.storage.get(this.GRUPOS_KEY);
        return this.grupos = stored || [];
    }

    async addGrupo(titulo: string, categoria: GrupoGastoModel['categoria']): Promise<GrupoGastoModel> {
        const grupo: GrupoGastoModel = {
            id: Date.now().toString(),
            titulo,
            categoria,
            personas: [],
            gastos: [],
            creadoEn: new Date().toISOString()
        };
        this.grupos.push(grupo);
        await this.storage.set(this.GRUPOS_KEY, this.grupos);
        return grupo;
    }

    async deleteGrupo(id: string): Promise<void> {
        this.grupos = this.grupos.filter(g => g.id !== id);
        await this.storage.set(this.GRUPOS_KEY, this.grupos);
    }

    private async saveGrupos(): Promise<void> {
        await this.storage.set(this.GRUPOS_KEY, this.grupos);
    }

    private getGrupo(grupoId: string): GrupoGastoModel | undefined {
        return this.grupos.find(g => g.id === grupoId);
    }

    // ── Personas dentro de un grupo ──────────────────
    async addPersona(grupoId: string, nombre: string, cbu?: string): Promise<void> {
        const grupo = this.getGrupo(grupoId);
        if (!grupo) return;
        grupo.personas.push({ id: Date.now().toString(), nombre, ...(cbu ? { cbu } : {}) });
        await this.saveGrupos();
    }

    async deletePersona(grupoId: string, personaId: string): Promise<void> {
        const grupo = this.getGrupo(grupoId);
        if (!grupo) return;
        grupo.personas = grupo.personas.filter(p => p.id !== personaId);
        grupo.gastos = grupo.gastos.filter(g =>
            g.pagadoPorId !== personaId && !g.participantesIds.includes(personaId)
        );
        await this.saveGrupos();
    }

    // ── Gastos dentro de un grupo ────────────────────
    async addGasto(
        grupoId: string,
        descripcion: string,
        monto: number,
        pagadoPorId: string,
        participantesIds: string[],
        montosIndividuales?: Record<string, number>
    ): Promise<void> {
        const grupo = this.getGrupo(grupoId);
        if (!grupo) return;
        const gasto: GastoModel = {
            id: Date.now().toString(),
            descripcion,
            monto,
            pagadoPorId,
            participantesIds,
            ...(montosIndividuales ? { montosIndividuales } : {}),
            fecha: new Date().toISOString().split('T')[0],
            grupoId
        };
        grupo.gastos.push(gasto);
        await this.saveGrupos();
    }

    async updateGasto(grupoId: string, gastoActualizado: GastoModel): Promise<void> {
        const grupo = this.getGrupo(grupoId);
        if (!grupo) return;
        const idx = grupo.gastos.findIndex(g => g.id === gastoActualizado.id);
        if (idx !== -1) grupo.gastos[idx] = gastoActualizado;
        await this.saveGrupos();
    }

    async saveOrder(grupos: GrupoGastoModel[]): Promise<void> {
        this.grupos = grupos;
        await this.storage.set(this.GRUPOS_KEY, this.grupos);
    }

    async deleteGasto(grupoId: string, gastoId: string): Promise<void> {
        const grupo = this.getGrupo(grupoId);
        if (!grupo) return;
        grupo.gastos = grupo.gastos.filter(g => g.id !== gastoId);
        await this.saveGrupos();
    }
}
