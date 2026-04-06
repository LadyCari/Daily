import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { LocalNotificationService } from './local-notification.service';
import { EventoCalendarioModel } from '../interfaces/evento-calendario.interface';
import { CategoriaEvento } from '../interfaces/categoria-evento.enum';

@Injectable({
    providedIn: 'root',
})
export class EventoCalendarioService {

    private readonly STORAGE_KEY = 'eventosCalendario';
    private eventos: EventoCalendarioModel[] = [];

    constructor(
        private storage: StorageService,
        private localNotif: LocalNotificationService
    ) {
        this.loadAll();
    }

    async loadAll(): Promise<EventoCalendarioModel[]> {
        const stored = await this.storage.get(this.STORAGE_KEY);
        this.eventos = stored || [];
        return this.eventos;
    }

    async add(titulo: string, tipo: CategoriaEvento, hora: string, fecha: string, descripcion?: string, repeat: EventoCalendarioModel['repeat'] = 'none', repeatDuration?: number, isPrivate = false): Promise<void> {
        const nuevo: EventoCalendarioModel = {
            id: Date.now().toString(),
            titulo,
            tipo,
            hora,
            fecha,
            descripcion,
            repeat,
            repeatDuration,
            private: isPrivate || undefined
        };
        this.eventos.push(nuevo);
        await this.storage.set(this.STORAGE_KEY, this.eventos);
        await this.localNotif.scheduleForEvent(nuevo);
    }

    async delete(id: string): Promise<void> {
        this.eventos = this.eventos.filter(e => e.id !== id);
        await this.storage.set(this.STORAGE_KEY, this.eventos);
        await this.localNotif.cancelForEvent(id);
    }

    async update(id: string, titulo: string, tipo: CategoriaEvento, hora: string, fecha: string, descripcion?: string, repeat?: EventoCalendarioModel['repeat'], repeatDuration?: number): Promise<void> {
        const ev = this.eventos.find(e => e.id === id);
        if (ev) {
            ev.titulo = titulo;
            ev.tipo = tipo;
            ev.hora = hora;
            ev.fecha = fecha;
            ev.descripcion = descripcion;
            ev.repeat = repeat ?? ev.repeat ?? 'none';
            ev.repeatDuration = repeatDuration;
            await this.storage.set(this.STORAGE_KEY, this.eventos);
            await this.localNotif.rescheduleForEvent(ev);
        }
    }


}
