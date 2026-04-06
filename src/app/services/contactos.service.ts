import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { PersonaModel } from '../interfaces/persona.interface';

@Injectable({ providedIn: 'root' })
export class ContactosService {

    private readonly KEY = 'contactos_globales';
    private contactos: PersonaModel[] = [];

    constructor(private storage: StorageService) { }

    async load(): Promise<PersonaModel[]> {
        const stored = await this.storage.get(this.KEY);
        return this.contactos = stored || [];
    }

    async add(nombre: string, cbu?: string): Promise<void> {
        await this.load();
        const existe = this.contactos.some(
            c => c.nombre.toLowerCase() === nombre.toLowerCase()
        );
        if (existe) return;
        this.contactos.push({ id: Date.now().toString(), nombre, ...(cbu ? { cbu } : {}) });
        await this.storage.set(this.KEY, this.contactos);
    }

    async delete(id: string): Promise<void> {
        await this.load();
        this.contactos = this.contactos.filter(c => c.id !== id);
        await this.storage.set(this.KEY, this.contactos);
    }
}
