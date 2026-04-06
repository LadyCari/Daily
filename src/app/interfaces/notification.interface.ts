export type NotificationType = 'group_invite' | 'partner_sync' | 'calendar_reminder';

export interface AppNotification {
  id: string;
  toUid: string;
  type: NotificationType;
  title: string;
  body: string;
  groupId?: string;
  groupName?: string;
  senderName?: string;
  read: boolean;
  createdAt: number;
}
