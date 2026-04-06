import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HeaderComponent } from 'src/app/page/header/header.page';
import { GastosService } from 'src/app/services/gastos.service';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { GrupoGastoModel } from 'src/app/interfaces/grupo-gasto.interface';
import { NuevoGrupoComponent } from 'src/app/modal/nuevo-grupo/nuevo-grupo.component';
import { ContactosComponent } from 'src/app/modal/contactos/contactos.component';

@Component({
    selector: 'app-gastos',
    templateUrl: './gastos.page.html',
    styleUrls: ['./gastos.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, DragDropModule]
})
export class GastosPage implements OnInit {

    grupos: GrupoGastoModel[] = [];

    readonly categoriaIcons: Record<string, string> = {
        general: 'fa-layer-group',
        regalo: 'fa-gift',
        cuentas: 'fa-file-invoice',
        otros: 'fa-ellipsis'
    };

    constructor(
        private gastosService: GastosService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private actionSheetCtrl: ActionSheetController,
        private router: Router
    ) { }

    async ngOnInit() { await this.loadGrupos(); }
    async ionViewWillEnter() { await this.loadGrupos(); }

    goBack() { this.router.navigate(['/extra']); }

    private async loadGrupos() {
        this.grupos = await this.gastosService.loadGrupos();
    }

    totalGrupo(g: GrupoGastoModel): number {
        return g.gastos.reduce((s, ga) => s + ga.monto, 0);
    }

    async openContactos() {
        const modal = await this.modalCtrl.create({
            component: ContactosComponent,
            breakpoints: [0, 0.6, 1],
            initialBreakpoint: 0.6,
            cssClass: 'themed-modal'
        });
        await modal.present();
    }

    async onReorder(event: CdkDragDrop<GrupoGastoModel[]>) {
        moveItemInArray(this.grupos, event.previousIndex, event.currentIndex);
        await this.gastosService.saveOrder(this.grupos);
    }

    async openNuevoGrupo() {
        const modal = await this.modalCtrl.create({ component: NuevoGrupoComponent });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.titulo) {
            await this.gastosService.addGrupo(data.titulo, data.categoria);
            await this.loadGrupos();
        }
    }

    openGrupo(g: GrupoGastoModel) {
        this.router.navigate(['/gastos/grupo', g.id]);
    }

    async menuGrupo(event: Event, g: GrupoGastoModel) {
        event.stopPropagation();
        const sheet = await this.actionSheetCtrl.create({
            header: g.titulo,
            buttons: [
                {
                    text: 'Eliminar grupo',
                    icon: 'trash-outline',
                    role: 'destructive',
                    handler: () => this.confirmarEliminarGrupo(g)
                },
                { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
            ]
        });
        await sheet.present();
    }

    async confirmarEliminarGrupo(g: GrupoGastoModel) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar grupo',
            message: `¿Eliminar "${g.titulo}"? Se perderán todos sus datos.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar', role: 'destructive',
                    handler: async () => {
                        await this.gastosService.deleteGrupo(g.id);
                        await this.loadGrupos();
                    }
                }
            ]
        });
        await alert.present();
    }
}
