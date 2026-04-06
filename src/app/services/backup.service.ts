import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ShareService } from './share.service';

const PREF_KEYS = [
  'grupos_gastos',
  'productos',
  'tarjetasCompras',
  'todos',
  'horario',
  'eventosCalendario',
  'custom-forms-v1',
  'contactos_globales'
] as const;

const LOCAL_KEYS = ['theme', 'app-colors'] as const;

const BACKUP_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class BackupService {

  constructor(private shareSvc: ShareService) {}

  private async createBackupJson(): Promise<string> {
    const prefs: Record<string, string> = {};
    for (const key of PREF_KEYS) {
      const { value } = await Preferences.get({ key });
      if (value !== null) prefs[key] = value;
    }
    const local: Record<string, string> = {};
    for (const key of LOCAL_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) local[key] = value;
    }
    return JSON.stringify({ version: BACKUP_VERSION, fecha: new Date().toISOString(), prefs, local }, null, 2);
  }

  private backupFilename(): string {
    return `daily-backup-${new Date().toISOString().slice(0, 10)}.json`;
  }

  /** Exporta y abre el share nativo (WhatsApp, email, etc.) */
  async exportAll(): Promise<void> {
    const json = await this.createBackupJson();
    await this.shareSvc.shareFile(this.backupFilename(), json, 'Respaldo completo');
  }

  /** Sube el respaldo directamente a Google Drive */
  async exportToDrive(accessToken: string): Promise<string> {
    const json = await this.createBackupJson();
    const filename = this.backupFilename();
    const boundary = 'daily_backup_boundary';
    const metadata = JSON.stringify({ name: filename, mimeType: 'application/json' });
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      json,
      `--${boundary}--`
    ].join('\r\n');

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message ?? 'Error al guardar en Drive';
      throw new Error(`[HTTP ${res.status}] ${msg}`);
    }

    return filename;
  }

  /** Lista los respaldos existentes en Google Drive (los más recientes primero) */
  async listDriveBackups(accessToken: string): Promise<{ id: string; name: string; date: string }[]> {
    const q = encodeURIComponent("name contains 'daily-backup' and trashed = false");
    const fields = encodeURIComponent('files(id,name,modifiedTime)');
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime+desc&fields=${fields}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Error ${res.status} al listar Drive`);
    }
    const data = await res.json();
    return (data.files ?? []).map((f: any) => ({
      id:   f.id,
      name: f.name,
      date: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('es-AR') : '',
    }));
  }

  /** Descarga el contenido de un archivo de Drive y lo importa */
  async importFromDrive(accessToken: string, fileId: string): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Error ${res.status} al descargar`);
    }
    const json = await res.text();
    await this.importAll(json);
  }

  async importAll(json: string): Promise<void> {
    let backup: any;
    try {
      backup = JSON.parse(json);
    } catch {
      throw new Error('Archivo inválido');
    }

    if (!backup?.prefs && !backup?.local) {
      throw new Error('Formato de respaldo inválido');
    }

    if (backup.prefs && typeof backup.prefs === 'object') {
      for (const key of PREF_KEYS) {
        const value = backup.prefs[key];
        if (value != null) await Preferences.set({ key, value: String(value) });
      }
    }

    if (backup.local && typeof backup.local === 'object') {
      for (const key of LOCAL_KEYS) {
        const value = backup.local[key];
        if (value != null) localStorage.setItem(key, String(value));
      }
    }
  }
}
