import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { GroupService } from './group.service';
import { Invitation } from '../interfaces/grupo.interface';

@Injectable({ providedIn: 'root' })
export class InvitationService {

  private fs      = inject(FirestoreService);
  private auth    = inject(AuthService);
  private groupSvc = inject(GroupService);

  /** Envía una invitación a un email para unirse a un grupo */
  async sendInvitation(groupId: string, groupName: string, toEmail: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('No autenticado');

    // Verificar que no haya invitación pendiente para el mismo grupo+email
    const existing = await this.fs.queryWhere2<Invitation>(
      'invitations',
      'groupId', '==', groupId,
      'toEmail', '==', toEmail
    );
    const pending = existing.find(i => i.status === 'pending');
    if (pending) throw new Error('Ya existe una invitación pendiente para ese email.');

    await this.fs.addDoc('invitations', {
      groupId,
      groupName,
      fromUid:  user.uid,
      fromName: user.name,
      toEmail:  toEmail.trim().toLowerCase(),
      status:   'pending',
      createdAt: Date.now(),
    });
  }

  /** Devuelve las invitaciones pendientes para el usuario actual */
  async getMyPendingInvitations(): Promise<Invitation[]> {
    const email = this.auth.user()?.email?.toLowerCase();
    if (!email) return [];
    return this.fs.queryWhere2<Invitation>(
      'invitations',
      'toEmail', '==', email,
      'status',  '==', 'pending'
    );
  }

  /** Acepta una invitación y agrega al usuario al grupo */
  async acceptInvitation(invitation: Invitation): Promise<void> {
    await this.groupSvc.addMember(invitation.groupId, invitation.groupName);
    await this.fs.setDoc(`invitations/${invitation.id}`, { status: 'accepted' });
  }

  /** Rechaza una invitación */
  async rejectInvitation(invitationId: string): Promise<void> {
    await this.fs.setDoc(`invitations/${invitationId}`, { status: 'rejected' });
  }
}
