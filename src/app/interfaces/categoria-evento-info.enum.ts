import { CategoriaEvento } from './categoria-evento.enum';

type EventoInfo = {
    label: string;
    icono: string;
    color: string;
};

export const CategoriaEventoInfo: Record<CategoriaEvento, EventoInfo> = {
[CategoriaEvento.ANIVERSARIO]: { label: 'Aniversario', icono: 'fa-ring', color: '#facc15' },
[CategoriaEvento.CITA]: { label: 'Cita', icono: 'fa-heart', color: '#fb7185' },
[CategoriaEvento.COMPRAS]: { label: 'Compras', icono: 'fa-cart-shopping', color: '#f97316' },
[CategoriaEvento.CUIDADO_PERSONAL]: { label: 'Cuidado Personal', icono: 'fa-spa', color: '#fbcfe8' },
[CategoriaEvento.CUMPLEANIOS]: { label: 'Cumpleaños', icono: 'fa-cake-candles', color: '#fb923c' },
[CategoriaEvento.ENTRETENIMIENTO]: { label: 'Entretenimiento', icono: 'fa-film', color: '#f472b6' },
[CategoriaEvento.ESTUDIO]: { label: 'Estudio', icono: 'fa-book-open', color: '#a78bfa' },
[CategoriaEvento.HOGAR]: { label: 'Hogar', icono: 'fa-house', color: '#fb7185' },
[CategoriaEvento.LIMPIEZA]: { label: 'Limpieza', icono: 'fa-broom', color: '#94a3b8' },
[CategoriaEvento.MEDICO]: { label: 'Médico', icono: 'fa-stethoscope', color: '#f87171' },
[CategoriaEvento.OTRO]: { label: 'Otro', icono: 'fa-star', color: '#fbbf24' },
[CategoriaEvento.PAGO]: { label: 'Pago / Vencimiento', icono: 'fa-file-invoice-dollar', color: '#facc15' },
[CategoriaEvento.REUNION]: { label: 'Reunión', icono: 'fa-handshake', color: '#22c55e' },
[CategoriaEvento.SALUD]: { label: 'Salud', icono: 'fa-heartbeat', color: '#ef4444' },
[CategoriaEvento.SOCIAL]: { label: 'Salida / Social', icono: 'fa-user-friends', color: '#f472b6' },
[CategoriaEvento.TRABAJO]: { label: 'Trabajo', icono: 'fa-briefcase', color: '#34d399' },
[CategoriaEvento.VIAJE]: { label: 'Viaje', icono: 'fa-plane', color: '#60a5fa' }

};
