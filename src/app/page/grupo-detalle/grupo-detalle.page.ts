import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ActionSheetController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from 'src/app/page/header/header.page';
import { GastosService } from 'src/app/services/gastos.service';
import { ContactosService } from 'src/app/services/contactos.service';
import { GrupoGastoModel } from 'src/app/interfaces/grupo-gasto.interface';
import { GastoModel } from 'src/app/interfaces/gasto.interface';
import { PersonaModel } from 'src/app/interfaces/persona.interface';
import { AddGastoComponent } from 'src/app/modal/gasto/gasto.component';
import { AddPersonaComponent } from 'src/app/modal/persona/persona.component';
import { DetalleGastoComponent } from 'src/app/modal/detalle-gasto/detalle-gasto.component';

export interface DeudaItem {
    deudorId: string;
    deudorNombre: string;
    acreedorId: string;
    acreedorNombre: string;
    monto: number;
}

@Component({
    selector: 'app-grupo-detalle',
    templateUrl: './grupo-detalle.page.html',
    styleUrls: ['./grupo-detalle.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class GrupoDetallePage implements OnInit {

    grupo!: GrupoGastoModel;
    deudas: DeudaItem[] = [];
    get personas(): PersonaModel[] { return this.grupo?.personas ?? []; }
    get gastos(): GastoModel[] { return this.grupo?.gastos ?? []; }

    constructor(
        private gastosService: GastosService,
        private contactosService: ContactosService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private actionSheetCtrl: ActionSheetController,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    async ngOnInit() { await this.loadGrupo(); }
    async ionViewWillEnter() { await this.loadGrupo(); }

    goBack() { this.router.navigate(['/gastos']); }

    private async loadGrupo() {
        const id = this.route.snapshot.paramMap.get('id')!;
        const grupos = await this.gastosService.loadGrupos();
        const encontrado = grupos.find(g => g.id === id);
        if (!encontrado) { this.goBack(); return; }
        this.grupo = encontrado;
        this.calcularDeudas();
    }

    // ── Personas ─────────────────────────────────────
    async openAddPersona() {
        const modal = await this.modalCtrl.create({
            component: AddPersonaComponent,
            componentProps: {
                showSaveToContacts: true,
                existingNombres: this.personas.map(p => p.nombre)
            }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.nombre) {
            await this.gastosService.addPersona(this.grupo.id, data.nombre, data.cbu);
            if (data.saveToContacts) {
                await this.contactosService.add(data.nombre, data.cbu);
            }
            await this.loadGrupo();
        }
    }

    async menuPersona(persona: PersonaModel) {
        const sheet = await this.actionSheetCtrl.create({
            header: persona.nombre,
            buttons: [
                {
                    text: 'Eliminar persona',
                    icon: 'trash-outline',
                    role: 'destructive',
                    handler: () => this.confirmarEliminarPersona(persona)
                },
                { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
            ]
        });
        await sheet.present();
    }

    async confirmarEliminarPersona(persona: PersonaModel) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar persona',
            message: `¿Eliminar a ${persona.nombre}? Se eliminarán también sus gastos.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar', role: 'destructive',
                    handler: async () => {
                        await this.gastosService.deletePersona(this.grupo.id, persona.id);
                        await this.loadGrupo();
                    }
                }
            ]
        });
        await alert.present();
    }

    getNombre(id: string): string {
        return this.personas.find(p => p.id === id)?.nombre ?? '?';
    }

    // ── Gastos ───────────────────────────────────────
    async openAddGasto() {
        if (this.personas.length < 2) {
            const alert = await this.alertCtrl.create({
                header: 'Faltan personas',
                message: 'Agregá al menos 2 personas antes de registrar un gasto.',
                buttons: ['OK']
            });
            await alert.present();
            return;
        }
        const modal = await this.modalCtrl.create({
            component: AddGastoComponent,
            componentProps: { personas: this.personas }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.descripcion) {
            await this.gastosService.addGasto(
                this.grupo.id,
                data.descripcion, data.monto, data.pagadoPorId,
                data.participantesIds, data.montosIndividuales
            );
            await this.loadGrupo();
        }
    }

    async openDetalleGasto(gasto: GastoModel) {
        const modal = await this.modalCtrl.create({
            component: DetalleGastoComponent,
            componentProps: { gasto, personas: this.personas }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.gastoEditado) {
            await this.gastosService.updateGasto(this.grupo.id, data.gastoEditado);
            await this.loadGrupo();
        }
        if (data?.eliminado) {
            const alert = await this.alertCtrl.create({
                header: 'Eliminar gasto',
                message: `¿Eliminar "${gasto.descripcion}"?`,
                buttons: [
                    { text: 'Cancelar', role: 'cancel' },
                    {
                        text: 'Eliminar', role: 'destructive',
                        handler: async () => {
                            await this.gastosService.deleteGasto(this.grupo.id, gasto.id);
                            await this.loadGrupo();
                        }
                    }
                ]
            });
            await alert.present();
        }
    }

    // ── Cálculo ───────────────────────────────────────
    calcularDeudas() {
        const balance: Record<string, number> = {};
        this.personas.forEach(p => balance[p.id] = 0);

        for (const g of this.gastos) {
            if (g.participantesIds.length === 0) continue;
            balance[g.pagadoPorId] = (balance[g.pagadoPorId] ?? 0) + g.monto;
            for (const pid of g.participantesIds) {
                const debe = g.montosIndividuales
                    ? (g.montosIndividuales[pid] ?? 0)
                    : g.monto / g.participantesIds.length;
                balance[pid] = (balance[pid] ?? 0) - debe;
            }
        }

        const acreedores = this.personas
            .filter(p => (balance[p.id] ?? 0) > 0.01)
            .map(p => ({ ...p, saldo: balance[p.id] }));
        const deudores = this.personas
            .filter(p => (balance[p.id] ?? 0) < -0.01)
            .map(p => ({ ...p, saldo: -balance[p.id] }));

        const deudas: DeudaItem[] = [];
        const acr = acreedores.map(a => ({ ...a }));
        const deu = deudores.map(d => ({ ...d }));

        let ai = 0, di = 0;
        while (ai < acr.length && di < deu.length) {
            const pago = Math.min(acr[ai].saldo, deu[di].saldo);
            if (pago > 0.01) {
                deudas.push({
                    deudorId: deu[di].id,
                    deudorNombre: deu[di].nombre,
                    acreedorId: acr[ai].id,
                    acreedorNombre: acr[ai].nombre,
                    monto: pago
                });
            }
            acr[ai].saldo -= pago;
            deu[di].saldo -= pago;
            if (acr[ai].saldo < 0.01) ai++;
            if (deu[di].saldo < 0.01) di++;
        }

        this.deudas = deudas;
    }

    getBalancePersona(id: string): number {
        let balance = 0;
        for (const g of this.gastos) {
            if (g.participantesIds.length === 0) continue;
            if (g.pagadoPorId === id) balance += g.monto;
            if (g.participantesIds.includes(id)) {
                const debe = g.montosIndividuales
                    ? (g.montosIndividuales[id] ?? 0)
                    : g.monto / g.participantesIds.length;
                balance -= debe;
            }
        }
        return balance;
    }

    totalGastos(): number {
        return this.gastos.reduce((s, g) => s + g.monto, 0);
    }

    // ── Compartir ─────────────────────────────────────
    async compartirGrupo() {
        const cat = this.grupo.categoria;
        const emojiCat: Record<string, string> = {
            general: '📋', regalo: '🎁', cuentas: '🧾', otros: '📌'
        };
        const total = this.totalGastos();

        const formatPeso = (n: number) =>
            '$' + n.toFixed(2).replace('.', ',');

        // Línea de gastos
        const lineasGastos = this.gastos.map(g => {
            const quien = this.getNombre(g.pagadoPorId);
            const partes = g.participantesIds.length;
            return `  • ${g.descripcion} — Pagó ${quien} — ${formatPeso(g.monto)} (${partes} pers.)`;
        }).join('\n');

        // Línea de deudas
        const lineasDeudas = this.deudas.length
            ? this.deudas.map(d => {
                const acreedor = this.personas.find(p => p.id === d.acreedorId);
                const cbuInfo = acreedor?.cbu ? ` (${acreedor.cbu})` : '';
                return `  💳 ${d.deudorNombre} → ${d.acreedorNombre}${cbuInfo}: ${formatPeso(d.monto)}`;
            }).join('\n')
            : '  ✅ ¡Todos pagaron lo justo!';

        // Personas
        const nombresPersonas = this.personas.map(p => p.nombre).join(', ');

        const texto =
            `${emojiCat[cat]} *${this.grupo.titulo}*
━━━━━━━━━━━━━━━━━━━━

👥 *Personas:* ${nombresPersonas}
💰 *Total gastado:* ${formatPeso(total)}

📝 *Gastos:*
${lineasGastos || '  (sin gastos)'}

⚖️ *Quién le debe a quién:*
${lineasDeudas}

_Calculado con Daily_ 🐰💙🐸`;

        // Web Share API (funciona en móvil: muestra panel nativo de compartir)
        if (navigator.share) {
            try {
                await navigator.share({ text: texto });
                return;
            } catch (_) { /* usuario canceló o no soportado */ }
        }

        // Fallback: abrir WhatsApp Web con el texto
        const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
    }
}
