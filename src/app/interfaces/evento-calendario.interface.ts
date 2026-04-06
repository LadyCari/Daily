import { CategoriaEvento } from './categoria-evento.enum';

export interface EventoCalendarioModel {
    id: string;
    titulo: string;
    tipo: CategoriaEvento;
    hora: string;        // 'HH:mm'
    fecha: string;       // ISO date string 'YYYY-MM-DD'
    descripcion?: string;
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatDuration?: number;
    private?: boolean;
}
