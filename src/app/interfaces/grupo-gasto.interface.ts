import { GastoModel } from './gasto.interface';
import { PersonaModel } from './persona.interface';

export type CategoriaGrupo = 'general' | 'regalo' | 'cuentas' | 'otros';

export interface GrupoGastoModel {
    id: string;
    titulo: string;
    categoria: CategoriaGrupo;
    personas: PersonaModel[];
    gastos: GastoModel[];
    creadoEn: string;
}
