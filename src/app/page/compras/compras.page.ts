import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSegment, IonLabel, IonSegmentButton } from '@ionic/angular/standalone';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../header/header.page';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  styleUrls: ['./compras.page.scss'],
  standalone: true,
  imports: [IonContent, IonSegment, IonSegmentButton, IonLabel, CommonModule, FormsModule, RouterModule, HeaderComponent]
})
export class ComprasPage implements OnInit {

  selectedSegment: string = 'tiendas';

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    // Sync segment with current route
    this.syncSegmentWithUrl(this.router.url);

    // Keep segment in sync when navigating (e.g. entering tienda detail)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.syncSegmentWithUrl(e.urlAfterRedirects || e.url);
    });

    if (!this.router.url.includes('/tienda/')) {
      this.navigateSegment(this.selectedSegment);
    }
  }

  private syncSegmentWithUrl(url: string) {
    if (url.includes('/productos')) {
      this.selectedSegment = 'productos';
    } else if (url.includes('/tiendas') || url.includes('/tienda/')) {
      this.selectedSegment = 'tiendas';
    }
  }

  /** Always navigate on click — fires even if segment value didn't change */
  onSegmentClick(value: string) {
    this.selectedSegment = value;
    this.navigateSegment(value);
  }

  private navigateSegment(value: string) {
    this.router.navigate([value], { relativeTo: this.route });
  }

}
