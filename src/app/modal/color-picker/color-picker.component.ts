import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonContent, IonHeader } from '@ionic/angular/standalone';

const PALETTE = [
  // Blancos / grises / negros
  '#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46', '#27272a', '#18181b', '#09090b',
  // Rojos
  '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d',
  // Naranjas
  '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
  // Amarillos
  '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207',
  // Verdes
  '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d',
  '#6ee7b7', '#34d399', '#10b981', '#059669',
  // Cyans / Azules claros
  '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#2bf8ff',
  // Azules
  '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
  // Violetas / Púrpuras
  '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9',
  // Rosas / Fucsias
  '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d',
];

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader],
})
export class ColorPickerComponent implements OnInit {
  @Input() color: string = '#2bf8ff';
  @Input() label: string = 'Color';

  palette = PALETTE;
  current: string = '#2bf8ff';
  hexInput: string = '#2bf8ff';
  hexError: boolean = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.current = this.color;
    this.hexInput = this.color;
  }

  select(c: string) {
    this.current = c;
    this.hexInput = c;
    this.hexError = false;
  }

  onHexChange(val: string) {
    this.hexInput = val;
    const clean = val.trim();
    const hex = clean.startsWith('#') ? clean : '#' + clean;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      this.current = hex;
      this.hexError = false;
    } else {
      this.hexError = true;
    }
  }

  confirm() {
    this.modalCtrl.dismiss(this.current, 'confirm', 'color-picker-modal');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel', 'color-picker-modal');
  }
}
