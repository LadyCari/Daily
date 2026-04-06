import { Injectable } from '@angular/core';
import { HorarioModel } from '../interfaces/horario.interface';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class Horario {

  private readonly STORAGE_KEY = 'horario';
  private horarios: HorarioModel[] = [];


  constructor(private storage: StorageService) {
    this.loadHorarios();
  }

  async loadHorarios(): Promise<HorarioModel[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    const raw = stored || [];
    // Migrate old entries to new schema
    const migrated = raw.map((it: any) => {
      // Already in new format (weekdays array)
      if (Array.isArray(it.weekdays)) return it as HorarioModel;

      // New schema but with single weekday number → convert to array
      if (it.startHour !== undefined && it.weekday !== undefined) {
        return {
          ...it,
          weekdays: [it.weekday]
        } as HorarioModel;
      }

      // Old format: { id, title, hour, date }
      const hour = it.hour ?? '09:00';
      const weekday = it.date ? new Date(it.date).getDay() : 1;
      return {
        id: it.id ?? Date.now().toString(),
        title: it.title ?? '',
        startHour: hour,
        endHour: undefined,
        weekdays: [weekday]
      } as HorarioModel;
    });
    this.horarios = migrated;
    // persist migrated data
    await this.storage.set(this.STORAGE_KEY, this.horarios);
    return this.horarios;
  }

  getHorarios(): HorarioModel[] {
    return this.horarios;
  }

  async addHorario(title: string, startHour: string, endHour: string | undefined, weekdays: number[], isPrivate = false): Promise<void> {
    const newHorario: HorarioModel = {
      id: Date.now().toString(),
      title,
      startHour,
      endHour,
      weekdays,
      private: isPrivate || undefined
    };

    this.horarios.push(newHorario);
    await this.storage.set(this.STORAGE_KEY, this.horarios);
  }

  async deleteHorario(id: string): Promise<void> {
    this.horarios = this.horarios.filter(t => t.id !== id);
    await this.storage.set(this.STORAGE_KEY, this.horarios);
  }

  async updateHorario(id: string, title: string, startHour: string, endHour: string | undefined, weekdays: number[]): Promise<void> {
    const horario = this.horarios.find(t => t.id === id);
    if (horario) {
      horario.title = title;
      horario.startHour = startHour;
      horario.endHour = endHour;
      horario.weekdays = weekdays;
      await this.storage.set(this.STORAGE_KEY, this.horarios);
    }
  }
}
