import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiendaDetailPagePage } from './tienda-detail-page.page';

describe('TiendaDetailPagePage', () => {
  let component: TiendaDetailPagePage;
  let fixture: ComponentFixture<TiendaDetailPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TiendaDetailPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
