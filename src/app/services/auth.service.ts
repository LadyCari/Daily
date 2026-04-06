import { Injectable, signal } from '@angular/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export interface GoogleUser {
  uid: string;
  name: string;
  email: string;
  imageUrl: string;
  accessToken: string;
  tokenExpiry: number;
}

const STORAGE_KEY = 'auth-google-user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _user = signal<GoogleUser | null>(null);
  readonly user = this._user.asReadonly();

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const info: GoogleUser = JSON.parse(saved);
      const current = await FirebaseAuthentication.getCurrentUser();
      if (current.user) {
        this._user.set(info);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async signIn(): Promise<void> {
    const result = await FirebaseAuthentication.signInWithGoogle({
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    const user: GoogleUser = {
      uid: result.user?.uid ?? '',
      name: result.user?.displayName ?? '',
      email: result.user?.email ?? '',
      imageUrl: result.user?.photoUrl ?? '',
      accessToken: result.credential?.accessToken ?? '',
      tokenExpiry: Date.now() + 55 * 60 * 1000
    };
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  async signOut(): Promise<void> {
    try { await FirebaseAuthentication.signOut(); } catch { /* ignore */ }
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async getAccessToken(): Promise<string> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const info: GoogleUser = JSON.parse(saved);
      if (info.accessToken && Date.now() < info.tokenExpiry) {
        return info.accessToken;
      }
    }
    // Token expirado o no existe, re-autenticar
    await this.signIn();
    const current = this._user();
    if (current?.accessToken) return current.accessToken;
    throw new Error('No se pudo obtener el token de acceso.');
  }
}
