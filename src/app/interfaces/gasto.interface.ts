export interface GastoModel {
    id: string;
    descripcion: string;
    monto: number;
    pagadoPorId: string;
    participantesIds: string[];
    montosIndividuales?: Record<string, number>; // si la division es desigual
    fecha: string;
    grupoId?: string;
}
