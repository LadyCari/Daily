import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Grupo, GrupoMember } from '../interfaces/grupo.interface';

@Injectable({ providedIn: 'root' })
export class GroupService {

  private fs   = inject(FirestoreService);
  private auth = inject(AuthService);

  // ── Helpers de ruta ────────────────────────────────────────────────────────

  /** ID compuesto para el documento de membership: uid_groupId */
  private memberDocId(uid: string, groupId: string): string {
    return `${uid}_${groupId}`;
  }

  // ── Grupos ─────────────────────────────────────────────────────────────────

  /** Devuelve todos los grupos en los que el usuario actual es miembro */
  async getMyGroups(): Promise<Grupo[]> {
    const uid = this.auth.user()?.uid;
    if (!uid) return [];
    const memberships = await this.fs.queryWhere<GrupoMember>('groupMembers', 'uid', '==', uid);
    const grupos: Grupo[] = [];
    for (const m of memberships) {
      const g = await this.fs.getDoc<Grupo>(`groups/${m.groupId}`);
      if (g) grupos.push(g);
    }
    return grupos;
  }

  /** Crea un grupo nuevo y agrega al creador como admin */
  async createGroup(name: string): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Necesitás iniciar sesión para crear un grupo.');

    const groupId = await this.fs.addDoc('groups', {
      name,
      createdBy: user.uid,
      createdAt: Date.now(),
    });

    // Agrega al creador como admin
    const memberDoc: GrupoMember = {
      uid:       user.uid,
      groupId,
      groupName: name,
      name:      user.name,
      email:     user.email,
      photoUrl:  user.imageUrl,
      role:      'admin',
      joinedAt:  Date.now(),
    };
    await this.fs.setDoc(`groupMembers/${this.memberDocId(user.uid, groupId)}`, memberDoc);

    return groupId;
  }

  /** Devuelve el detalle de un grupo */
  async getGroup(groupId: string): Promise<Grupo | null> {
    return this.fs.getDoc<Grupo>(`groups/${groupId}`);
  }

  /** Devuelve todos los miembros de un grupo */
  async getMembers(groupId: string): Promise<GrupoMember[]> {
    return this.fs.queryWhere<GrupoMember>('groupMembers', 'groupId', '==', groupId);
  }

  /** Agrega un miembro al grupo (llamado al aceptar una invitación) */
  async addMember(groupId: string, groupName: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    const memberDoc: GrupoMember = {
      uid:       user.uid,
      groupId,
      groupName,
      name:      user.name,
      email:     user.email,
      photoUrl:  user.imageUrl,
      role:      'member',
      joinedAt:  Date.now(),
    };
    await this.fs.setDoc(`groupMembers/${this.memberDocId(user.uid, groupId)}`, memberDoc);
  }

  /** Abandona un grupo */
  async leaveGroup(groupId: string): Promise<void> {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    await this.fs.deleteDoc(`groupMembers/${this.memberDocId(uid, groupId)}`);
  }

  /** Actualiza el timestamp de último push del miembro */
  async updateLastPushed(groupId: string): Promise<void> {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    await this.fs.setDoc(`groupMembers/${this.memberDocId(uid, groupId)}`, { lastPushed: Date.now() });
  }
}
