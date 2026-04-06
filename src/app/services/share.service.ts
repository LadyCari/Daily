import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

@Injectable({ providedIn: 'root' })
export class ShareService {

  async shareFile(filename: string, json: string, title: string): Promise<void> {
    await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8
    });

    const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });

    await Share.share({ title, url: uri, dialogTitle: 'Compartir' });
  }

  // Abre el selector de archivos del dispositivo
  readFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { reject(new Error('Sin archivo')); return; }
        resolve(await file.text());
      };
      input.oncancel = () => reject(new Error('Cancelado'));
      input.click();
    });
  }
}
