export interface GrupoMember {
  uid: string;
  groupId: string;
  groupName: string;
  name: string;
  email: string;
  photoUrl: string;
  role: 'admin' | 'member';
  joinedAt: number;
  lastPushed?: number;
}

export interface Grupo {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  fromUid: string;
  fromName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export type SyncSection = 'horario' | 'eventos' | 'todos' | 'gastos';

export const SYNC_SECTION_LABELS: Record<SyncSection, string> = {
  horario: 'Horario semanal',
  eventos: 'Calendario',
  todos:   'Recordatorios',
  gastos:  'Gastos',
};

export const SYNC_SECTION_ICONS: Record<SyncSection, string> = {
  horario: 'fa-clock',
  eventos: 'fa-calendar',
  todos:   'fa-note-sticky',
  gastos:  'fa-wallet',
};

export const ALL_SECTIONS: SyncSection[] = ['horario', 'eventos', 'todos', 'gastos'];

export interface Subscription {
  groupId: string;
  receiverUid: string;
  senderUid: string;
  horario: boolean;
  eventos: boolean;
  todos: boolean;
  gastos: boolean;
}

export interface SharedData {
  groupId: string;
  senderUid: string;
  senderName: string;
  lastUpdated: number;
  horario: any[] | null;
  eventos: any[] | null;
  todos: any[] | null;
  gastos: any[] | null;
}
