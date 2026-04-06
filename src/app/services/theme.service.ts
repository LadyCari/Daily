import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private darkMode = true; // default: dark
    private themeSubject: BehaviorSubject<boolean>;
    public theme$;

    constructor() {
        const saved = localStorage.getItem('theme');
        this.darkMode = saved !== null ? saved === 'dark' : true;
        this.themeSubject = new BehaviorSubject<boolean>(this.darkMode);
        this.theme$ = this.themeSubject.asObservable();
        this.apply();
    }

    get isDark(): boolean { return this.darkMode; }

    toggle() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
        this.apply();
        this.themeSubject.next(this.darkMode);
    }

    private apply() {
        // Apply class to both documentElement and body to ensure Ionic picks it up
        document.documentElement.classList.toggle('dark', this.darkMode);
        document.documentElement.classList.toggle('light', !this.darkMode);
        document.body.classList.toggle('dark', this.darkMode);
        document.body.classList.toggle('light', !this.darkMode);
    }
}
