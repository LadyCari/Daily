import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.page';

@Component({
  selector: 'app-forms-shared',
  templateUrl: './forms-shared.page.html',
  styleUrls: ['./forms-shared.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent],
})
export class FormsSharedPage implements OnInit {

  form: any = null;
  senderName = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras?.state
      ?? history.state;
    this.form       = state?.['form']       ?? null;
    this.senderName = state?.['senderName'] ?? '';
  }

  getFieldLabel(field: any): string {
    return field?.label ?? field?.name ?? 'Campo';
  }

  getFieldType(field: any): string {
    return field?.type ?? 'text';
  }

  getItemValue(item: any, fieldId: string): any {
    return item?.values?.[fieldId] ?? item?.[fieldId] ?? '—';
  }

  volver() {
    this.router.navigate(['/forms']);
  }
}
