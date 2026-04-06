import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.page';

@Component({
  selector: 'app-extra',
  templateUrl: './extra.page.html',
  styleUrls: ['./extra.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent]
})
export class ExtraPage {
  constructor(private router: Router) { }

  goToGastos() { this.router.navigate(['/gastos']); }
  goToForms()  { this.router.navigate(['/forms']); }
}
