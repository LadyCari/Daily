import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { EventoCalendarioModel } from 'src/app/interfaces/evento-calendario.interface';
import { CategoriaEvento } from 'src/app/interfaces/categoria-evento.enum';
import { CategoriaEventoInfo } from 'src/app/interfaces/categoria-evento-info.enum';

@Component({
    selector: 'app-eventos-dia',
    templateUrl: './eventos-dia.component.html',
    styleUrls: ['./eventos-dia.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class EventosDiaComponent {

    @Input() fecha = '';          // 'dd de mes yyyy'
    @Input() eventos: EventoCalendarioModel[] = [];

    categoriaInfo = CategoriaEventoInfo;

    constructor(private modalCtrl: ModalController) { }

    getIcono(tipo: CategoriaEvento): string {
        return this.categoriaInfo[tipo]?.icono ?? 'fa-star';
    }

    getColor(tipo: CategoriaEvento): string {
        return this.categoriaInfo[tipo]?.color ?? '#fff';
    }

    getLabel(tipo: CategoriaEvento): string {
        return this.categoriaInfo[tipo]?.label ?? tipo;
    }

    editar(ev: EventoCalendarioModel) {
        this.modalCtrl.dismiss({ accion: 'editar', evento: ev });
    }

    eliminar(ev: EventoCalendarioModel) {
        this.modalCtrl.dismiss({ accion: 'eliminar', evento: ev });
    }

    agregar() {
        this.modalCtrl.dismiss({ accion: 'agregar' });
    }

    cerrar() {
        this.modalCtrl.dismiss();
    }
}
