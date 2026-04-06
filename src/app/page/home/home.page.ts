import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService } from '../../services/todo.service';
import { Todo } from '../../interfaces/todo.inerface';
import { HeaderComponent } from '../header/header.page';
import { ModalController, AlertController, IonicModule } from '@ionic/angular';
import { AddTodoComponent } from '../../modal/todo/todo.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Horario } from 'src/app/services/horario.service';
import { AddHorarioComponent } from 'src/app/modal/horario/horario.component';
import { HorarioModel } from 'src/app/interfaces/horario.interface';
import { EventoCalendarioService } from 'src/app/services/evento-calendario.service';
import { EventoCalendarioModel } from 'src/app/interfaces/evento-calendario.interface';
import { CategoriaEvento } from 'src/app/interfaces/categoria-evento.enum';
import { CategoriaEventoInfo } from 'src/app/interfaces/categoria-evento-info.enum';
import { AddEventoComponent } from 'src/app/modal/evento/evento.component';
import { EventosDiaComponent } from 'src/app/modal/eventos-dia/eventos-dia.component';
import { SyncService } from 'src/app/services/sync.service';

export interface CalendarDay {
  date: Date | null;
  numero: number;
  eventos: EventoCalendarioModel[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    IonicModule,
    DragDropModule,
  ]
})
export class HomePage {

  todos: Todo[] = [];
  todosRecibidos: { items: Todo[]; senderName: string }[] = [];

  horariosRecibidos: HorarioModel[] = [];
  eventosRecibidos: EventoCalendarioModel[] = [];

  dias = [
    { label: 'L', name: 'Lunes', index: 1 },
    { label: 'M', name: 'Martes', index: 2 },
    { label: 'M', name: 'Miércoles', index: 3 },
    { label: 'J', name: 'Jueves', index: 4 },
    { label: 'V', name: 'Viernes', index: 5 },
    { label: 'S', name: 'Sábado', index: 6 },
    { label: 'D', name: 'Domingo', index: 0 }
  ];

  diaActivo = new Date().getDay();
  horarios: HorarioModel[] = [];

  // ── Calendario ──────────────────────────────────────
  eventos: EventoCalendarioModel[] = [];
  categoriaEventoInfo = CategoriaEventoInfo;
  mesActivo: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  calendarDays: CalendarDay[] = [];
  readonly DIAS_HEADER = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  today = new Date();

  constructor(
    private todoService: TodoService,
    private horarioService: Horario,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private eventoService: EventoCalendarioService,
    private syncSvc: SyncService,
  ) { }

  async ionViewWillEnter() {
    await this.syncSvc.loadAllPersisted();
    await this.loadTodos();
    await this.loadHorarios();
    await this.loadEventos();
  }

  // ── Todos ────────────────────────────────────────────
  async loadTodos() {
    this.todos = await this.todoService.loadTodos();
    this.todosRecibidos = Array.from(this.syncSvc.receivedData().values())
      .filter(d => Array.isArray(d.todos) && (d.todos as any[]).length > 0)
      .map(d => ({ items: d.todos as Todo[], senderName: d.senderName }));
  }

  async toggleTodo(id: string) {
    await this.todoService.toggleTodo(id);
    await this.loadTodos();
  }

  async deleteTodo(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar pendiente',
      message: '¿Estás seguro de que deseas eliminar este pendiente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            await this.todoService.deleteTodo(id);
            await this.loadTodos();
          }
        }
      ]
    });
    await alert.present();
  }

  async openAddToDoModal() {
    const modal = await this.modalCtrl.create({ component: AddTodoComponent, cssClass: 'themed-modal' });
    modal.style.setProperty('--modal-accent', 'var(--home-icon-color, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'var(--recordatorio-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-home, #07070a)');
    modal.style.setProperty('--modal-glow', 'var(--home-glow, rgba(43, 248, 255, 0.15))');
    modal.style.setProperty('--modal-input-border', 'var(--recordatorio-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-input-glow', 'var(--home-glow, rgba(43, 248, 255, 0.20))');
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.title) {
      await this.todoService.addTodo(data.title, data.isPrivate);
      await this.loadTodos();
    }
  }

  onDrop(event: CdkDragDrop<Todo[]>) {
    moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
    void this.todoService.setTodos(this.todos);
  }

  // ── Horarios ─────────────────────────────────────────
  async loadHorarios() {
    this.horarios = await this.horarioService.loadHorarios();
    this.horariosRecibidos = [];
    for (const d of this.syncSvc.receivedData().values()) {
      if (Array.isArray(d.horario)) {
        this.horariosRecibidos.push(...(d.horario as HorarioModel[]));
      }
    }
  }

  async deleteHorario(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar horario',
      message: '¿Querés eliminar este horario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.horarioService.deleteHorario(id);
            await this.loadHorarios();
          }
        }
      ]
    });
    await alert.present();
  }

  async openAddHorarioModal() {
    const modal = await this.modalCtrl.create({ component: AddHorarioComponent, cssClass: 'themed-modal' });
    modal.style.setProperty('--modal-accent', 'var(--home-icon-color, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'var(--horario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-home, #07070a)');
    modal.style.setProperty('--modal-glow', 'var(--home-glow, rgba(43, 248, 255, 0.15))');
    modal.style.setProperty('--modal-input-border', 'var(--horario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-input-glow', 'var(--home-glow, rgba(43, 248, 255, 0.20))');
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.title) {
      await this.horarioService.addHorario(data.title, data.startHour, data.endHour, data.weekdays, data.isPrivate);
      await this.loadHorarios();
    }
  }

  getHorariosDelDia(): HorarioModel[] {
    return this.horarios
      .filter(h => (h.weekdays ?? [h as any]).includes(this.diaActivo))
      .sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
  }

  getHorariosRecibidosDelDia(): HorarioModel[] {
    return this.horariosRecibidos
      .filter(h => (h.weekdays ?? []).includes(this.diaActivo))
      .sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
  }

  /** Events that fall on the active week-day AND in the current week */
  getEventosDelDia(): EventoCalendarioModel[] {
    const hoy = this.today;
    const inicioSemana = new Date(hoy);
    const diaSemana = hoy.getDay(); // 0=Sun...6=Sat
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(hoy.getDate() + diffLunes);
    inicioSemana.setHours(0, 0, 0, 0);

    const targetDate = new Date(inicioSemana);
    const offset = this.diaActivo === 0 ? 6 : this.diaActivo - 1;
    targetDate.setDate(inicioSemana.getDate() + offset);

    const todos = [...this.eventos, ...this.eventosRecibidos];
    return todos.filter(ev => this.eventOccursOn(ev, targetDate)).sort((a, b) => a.hora.localeCompare(b.hora));
  }

  // ── Eventos del Calendario ───────────────────────────
  async loadEventos() {
    this.eventos = await this.eventoService.loadAll();
    this.eventosRecibidos = [];
    for (const d of this.syncSvc.receivedData().values()) {
      if (Array.isArray(d.eventos)) {
        this.eventosRecibidos.push(...(d.eventos as EventoCalendarioModel[]));
      }
    }
    this.buildCalendar();
  }

  private getOccurrenceNumber(ev: EventoCalendarioModel, date: Date): number {
    const start = new Date(ev.fecha + 'T00:00:00');
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startNormalize = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    
    if (target < startNormalize) return 0;
    const diffDays = Math.round((target.getTime() - startNormalize.getTime()) / 86400000);

    switch (ev.repeat) {
      case 'daily':
        return diffDays + 1;
      case 'weekly':
        return Math.floor(diffDays / 7) + 1;
      case 'monthly':
        return (target.getFullYear() - startNormalize.getFullYear()) * 12 + (target.getMonth() - startNormalize.getMonth()) + 1;
      case 'yearly':
        return target.getFullYear() - startNormalize.getFullYear() + 1;
      default:
        return 1;
    }
  }

  private eventOccursOn(ev: EventoCalendarioModel, date: Date): boolean {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (ev.repeat === 'none' || !ev.repeat) {
      return ev.fecha === iso;
    }
    const evDate = new Date(ev.fecha + 'T00:00:00');
    // don't show occurrences before original event date
    if (date < evDate) return false;

    if (ev.repeatDuration) {
      const occurrenceNumber = this.getOccurrenceNumber(ev, date);
      if (occurrenceNumber > ev.repeatDuration) return false;
    }

    switch (ev.repeat) {
      case 'daily':
        return true;
      case 'weekly':
        return date.getDay() === evDate.getDay();
      case 'monthly':
        return date.getDate() === evDate.getDate();
      case 'yearly':
        return date.getDate() === evDate.getDate() && date.getMonth() === evDate.getMonth();
      default:
        return ev.fecha === iso;
    }
  }

  // ── Abrir modal del día ───────────────────────────
  async openDiaModal(day: CalendarDay) {
    if (!day.date) return;
    const iso = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
    const label = day.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

    const diaModal = await this.modalCtrl.create({
      component: EventosDiaComponent,
      componentProps: { fecha: label, eventos: day.eventos },
      breakpoints: [0, 0.6, 1],
      initialBreakpoint: 0.6,
      cssClass: 'themed-modal'
    });
    diaModal.style.setProperty('--modal-accent', 'var(--home-icon-color, #2bf8ff)');
    diaModal.style.setProperty('--modal-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    diaModal.style.setProperty('--modal-bg', 'var(--app-color-bg-home, #07070a)');
    diaModal.style.setProperty('--modal-glow', 'var(--home-glow, rgba(43, 248, 255, 0.15))');
    diaModal.style.setProperty('--modal-input-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    diaModal.style.setProperty('--modal-input-glow', 'var(--home-glow, rgba(43, 248, 255, 0.20))');
    await diaModal.present();
    const { data } = await diaModal.onDidDismiss();
    if (!data) return;

    if (data.accion === 'eliminar') {
      const alert = await this.alertCtrl.create({
        header: 'Eliminar evento',
        message: `¿Querés eliminar "${data.evento.titulo}"?`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Eliminar', role: 'destructive',
            handler: async () => {
              await this.eventoService.delete(data.evento.id);
              await this.loadEventos();
            }
          }
        ]
      });
      await alert.present();
    } else if (data.accion === 'editar') {
      await this.abrirEditorEvento(data.evento);
    } else if (data.accion === 'agregar') {
      await this.openAddEventoModal(iso);
    }
  }

  private async abrirEditorEvento(ev: EventoCalendarioModel) {
    const modal = await this.modalCtrl.create({
      component: AddEventoComponent,
      componentProps: { eventoEditar: ev },
      cssClass: 'themed-modal'
    });
    modal.style.setProperty('--modal-accent', 'var(--home-icon-color, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-home, #07070a)');
    modal.style.setProperty('--modal-glow', 'var(--home-glow, rgba(43, 248, 255, 0.15))');
    modal.style.setProperty('--modal-input-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-input-glow', 'var(--home-glow, rgba(43, 248, 255, 0.20))');
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.id) {
      await this.eventoService.update(data.id, data.titulo, data.tipo, data.hora, data.fecha, data.descripcion, data.repeat, data.repeatDuration);
      await this.loadEventos();
    }
  }

  async openAddEventoModal(fechaPreset?: string) {
    const props: any = {};
    if (fechaPreset) props['fechaPreset'] = fechaPreset;
    const modal = await this.modalCtrl.create({ component: AddEventoComponent, componentProps: props, cssClass: 'themed-modal' });
    modal.style.setProperty('--modal-accent', 'var(--home-icon-color, #2bf8ff)');
    modal.style.setProperty('--modal-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-bg', 'var(--app-color-bg-home, #07070a)');
    modal.style.setProperty('--modal-glow', 'var(--home-glow, rgba(43, 248, 255, 0.15))');
    modal.style.setProperty('--modal-input-border', 'var(--calendario-border, rgba(43, 248, 255, 0.22))');
    modal.style.setProperty('--modal-input-glow', 'var(--home-glow, rgba(43, 248, 255, 0.20))');
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.titulo) {
      await this.eventoService.add(data.titulo, data.tipo, data.hora, data.fecha, data.descripcion, data.repeat, data.repeatDuration, data.isPrivate);
      await this.loadEventos();
    }
  }

  getEventoIcono(tipo: CategoriaEvento): string {
    return this.categoriaEventoInfo[tipo]?.icono ?? 'fa-star';
  }

  getEventoColor(tipo: CategoriaEvento): string {
    return this.categoriaEventoInfo[tipo]?.color ?? '#fff';
  }

  // ── Calendar grid ─────────────────────────────────────
  get mesLabel(): string {
    return this.mesActivo.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  prevMes() {
    const prev = new Date(this.mesActivo.getFullYear(), this.mesActivo.getMonth() - 1, 1);
    this.mesActivo = prev;
    this.buildCalendar();
  }

  nextMes() {
    const next = new Date(this.mesActivo.getFullYear(), this.mesActivo.getMonth() + 1, 1);
    this.mesActivo = next;
    this.buildCalendar();
  }

  isToday(day: CalendarDay): boolean {
    if (!day.date) return false;
    const t = this.today;
    return day.date.getFullYear() === t.getFullYear() &&
      day.date.getMonth() === t.getMonth() &&
      day.date.getDate() === t.getDate();
  }

  buildCalendar() {
    const year = this.mesActivo.getFullYear();
    const month = this.mesActivo.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 0=Sun → convert to Mon-first: Mon=0 ... Sun=6
    let startDow = firstDay.getDay(); // 0 Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Mon-first offset

    const days: CalendarDay[] = [];

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
      days.push({ date: null, numero: 0, eventos: [] });
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const evsDia = [...this.eventos, ...this.eventosRecibidos].filter(ev => this.eventOccursOn(ev, date));
      days.push({ date, numero: d, eventos: evsDia });
    }

    this.calendarDays = days;
  }
}