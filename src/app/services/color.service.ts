import { Injectable } from '@angular/core';

export interface AppColors {
    // Section backgrounds
    bgHome: string;
    bgExtra: string;
    bgCompras: string;
    // Global UI
    header: string;
    footer: string;
    text: string;
    // Home accent (drives all cards globally: border + gradient)
    homeAccent: string;
    homeIconColor: string;
    homeCalSelected: string;
    // Per-section card accent (each drives its own border + gradient)
    recordatorioAccent: string;
    horarioAccent: string;
    calendarioAccent: string;

    horarioIconColor: string;
    horarioTextColor: string;
    horarioDaysBg: string;
    horarioDaySelected: string;
    horarioItemBg: string;

    // Recordatorio header
    recordatorioIconColor: string;
    recordatorioTextColor: string;
    // Post-it colors (Recordatorio)
    postit1Accent: string;
    postit2Accent: string;
    postit3Accent: string;
    postit4Accent: string;
    postitIconColor: string;

    // Calendario
    calendarioIconColor: string;
    calendarioTituloColor: string;
    calendarioNavIconColor: string;
    calendarioTextColor: string;
    calendarioMesTextColor: string;
    // Compras / Tienda — Secciones
    comprasAccent: string;
    comprasIconColor: string;
    // Compras / Tienda — Segmento (header)
    tiendaSegmentoFondo: string;
    tiendaSegmentoTexto: string;
    tiendaSegmentoActivo: string;
    // Compras / Tienda — Botones
    tiendaBtnNueva: string;
    tiendaBtnImportar: string;
}

const DEFAULTS: AppColors = {
    bgHome: '#07070a',
    bgExtra: '#07070a',
    bgCompras: '#07070a',
    header: '#04040b',
    footer: '#04040b',
    text: '#ffffff',
    homeAccent: '#2bf8ff',
    homeIconColor: '#2bf8ff',
    homeCalSelected: '#2bf8ff',
    recordatorioAccent: '#2bf8ff',
    horarioAccent: '#2bf8ff',
    calendarioAccent: '#2bf8ff',

    horarioIconColor: '#2bf8ff',
    horarioTextColor: '#ffffff',
    horarioDaysBg: '#2bf8ff',
    horarioDaySelected: '#2bf8ff',
    horarioItemBg: '#ffffff',

    recordatorioIconColor: '#2bf8ff',
    recordatorioTextColor: '#ffffff',
    postit1Accent: '#2bf8ff',
    postit2Accent: '#facc15',
    postit3Accent: '#f472b6',
    postit4Accent: '#a78bfa',
    postitIconColor: '#2bf8ff',

    calendarioIconColor: '#2bf8ff',
    calendarioTituloColor: '#ffffff',
    calendarioNavIconColor: '#ffffff',
    calendarioTextColor: '#ffffff',
    calendarioMesTextColor: '#ffffff',
    comprasAccent: '#2bf8ff',
    comprasIconColor: '#2bf8ff',
    tiendaSegmentoFondo: '#1a1a2e',
    tiendaSegmentoTexto: '#ffffff',
    tiendaSegmentoActivo: '#2bf8ff',
    tiendaBtnNueva: '#2bf8ff',
    tiendaBtnImportar: '#ffffff',
};

const STORAGE_KEY = 'app-colors';

@Injectable({ providedIn: 'root' })
export class ColorService {

    private current: AppColors = { ...DEFAULTS };

    constructor() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.current = { ...DEFAULTS, ...JSON.parse(saved) };
            } catch { /* ignore */ }
        }
        this.applyAll();
    }

    get colors(): AppColors { return { ...this.current }; }

    setColor<K extends keyof AppColors>(key: K, value: string) {
        this.current[key] = value;
        this.save();
        this.applyAll();
    }

    reset() {
        this.current = { ...DEFAULTS };
        localStorage.removeItem(STORAGE_KEY);
        this.applyAll();
    }

    private save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
    }

    private hexToRgba(hex: string, alpha: number): string {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(43,248,255,${alpha})`;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private applyAll() {
        const roots: CSSStyleDeclaration[] = [document.documentElement.style, document.body.style];

        for (const s of roots) {
            s.setProperty('--app-color-bg-home', this.current.bgHome);
            s.setProperty('--app-color-bg-extra', this.current.bgExtra);
            s.setProperty('--app-color-bg-compras', this.current.bgCompras);
            s.setProperty('--app-color-header', this.current.header);
            s.setProperty('--app-color-footer', this.current.footer);
            s.setProperty('--app-color-text', this.hexToRgba(this.current.text, 0.88));

            // Global home accent
            const a = this.current.homeAccent;
            s.setProperty('--home-accent', a);
            s.setProperty('--home-border', this.hexToRgba(a, 0.22));
            s.setProperty('--home-gradient', this.hexToRgba(a, 0.07));
            s.setProperty('--home-gradient-dim', this.hexToRgba(a, 0.03));
            s.setProperty('--home-glow', this.hexToRgba(a, 0.18));
            s.setProperty('--home-icon-color', this.current.homeIconColor);
            s.setProperty('--home-cal-selected', this.current.homeCalSelected);

            // Per-section card accent
            s.setProperty('--recordatorio-icon-color', this.current.recordatorioIconColor);
            s.setProperty('--recordatorio-text-color', this.hexToRgba(this.current.recordatorioTextColor, 0.88));
            s.setProperty('--postit-icon-color', this.current.postitIconColor);

            const ra = this.current.recordatorioAccent;
            s.setProperty('--recordatorio-border', this.hexToRgba(ra, 0.22));
            s.setProperty('--recordatorio-bg', this.hexToRgba(ra, 0.07));
            s.setProperty('--recordatorio-bg-dim', this.hexToRgba(ra, 0.03));

            s.setProperty('--horario-icon-color', this.current.horarioIconColor);
            s.setProperty('--horario-text-color', this.hexToRgba(this.current.horarioTextColor, 0.88));
            s.setProperty('--horario-item-bg', this.hexToRgba(this.current.horarioItemBg, 0.05));

            const ha = this.current.horarioAccent;
            s.setProperty('--horario-border', this.hexToRgba(ha, 0.22));
            s.setProperty('--horario-bg', this.hexToRgba(ha, 0.07));
            s.setProperty('--horario-bg-dim', this.hexToRgba(ha, 0.03));

            s.setProperty('--horario-days-bg', this.hexToRgba(this.current.horarioDaysBg, 0.06));
            s.setProperty('--horario-day-selected', this.current.horarioDaySelected);

            s.setProperty('--calendario-icon-color', this.current.calendarioIconColor);
            s.setProperty('--calendario-titulo-color', this.hexToRgba(this.current.calendarioTituloColor, 0.88));
            s.setProperty('--calendario-nav-icon-color', this.current.calendarioNavIconColor);
            s.setProperty('--calendario-text-color', this.hexToRgba(this.current.calendarioTextColor, 0.85));
            s.setProperty('--calendario-mes-text-color', this.hexToRgba(this.current.calendarioMesTextColor, 0.9));

            const calA = this.current.calendarioAccent;
            s.setProperty('--calendario-border', this.hexToRgba(calA, 0.22));
            s.setProperty('--calendario-bg', this.hexToRgba(calA, 0.07));
            s.setProperty('--calendario-bg-dim', this.hexToRgba(calA, 0.03));

            const p1 = this.current.postit1Accent;
            s.setProperty('--postit-1-border', this.hexToRgba(p1, 0.22));
            s.setProperty('--postit-1-bg', this.hexToRgba(p1, 0.07));
            s.setProperty('--postit-1-bg-dim', this.hexToRgba(p1, 0.03));

            const p2 = this.current.postit2Accent;
            s.setProperty('--postit-2-border', this.hexToRgba(p2, 0.22));
            s.setProperty('--postit-2-bg', this.hexToRgba(p2, 0.07));
            s.setProperty('--postit-2-bg-dim', this.hexToRgba(p2, 0.03));

            const p3 = this.current.postit3Accent;
            s.setProperty('--postit-3-border', this.hexToRgba(p3, 0.22));
            s.setProperty('--postit-3-bg', this.hexToRgba(p3, 0.07));
            s.setProperty('--postit-3-bg-dim', this.hexToRgba(p3, 0.03));

            const p4 = this.current.postit4Accent;
            s.setProperty('--postit-4-border', this.hexToRgba(p4, 0.22));
            s.setProperty('--postit-4-bg', this.hexToRgba(p4, 0.07));
            s.setProperty('--postit-4-bg-dim', this.hexToRgba(p4, 0.03));

            const comprasA = this.current.comprasAccent;
            s.setProperty('--compras-accent', comprasA);
            s.setProperty('--compras-border', this.hexToRgba(comprasA, 0.22));
            s.setProperty('--compras-bg', this.hexToRgba(comprasA, 0.07));
            s.setProperty('--compras-bg-dim', this.hexToRgba(comprasA, 0.03));
            s.setProperty('--compras-glow', this.hexToRgba(comprasA, 0.18));
            s.setProperty('--compras-icon-color', this.current.comprasIconColor);

            // Segmento
            s.setProperty('--tienda-segmento-fondo', this.current.tiendaSegmentoFondo);
            s.setProperty('--tienda-segmento-texto', this.hexToRgba(this.current.tiendaSegmentoTexto, 0.55));
            s.setProperty('--tienda-segmento-activo', this.current.tiendaSegmentoActivo);

            // Botones
            const btnN = this.current.tiendaBtnNueva;
            s.setProperty('--tienda-btn-nueva', btnN);
            s.setProperty('--tienda-btn-nueva-bg', this.hexToRgba(btnN, 0.15));
            s.setProperty('--tienda-btn-nueva-border', this.hexToRgba(btnN, 0.40));

            const btnI = this.current.tiendaBtnImportar;
            s.setProperty('--tienda-btn-importar', btnI);
            s.setProperty('--tienda-btn-importar-bg', this.hexToRgba(btnI, 0.08));
            s.setProperty('--tienda-btn-importar-border', this.hexToRgba(btnI, 0.20));
        }
    }
}
