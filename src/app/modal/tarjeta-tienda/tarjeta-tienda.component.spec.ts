import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TarjetaTiendaComponent } from './tarjeta-tienda.component';

describe('TarjetaTiendaComponent', () => {
  let component: TarjetaTiendaComponent;
  let fixture: ComponentFixture<TarjetaTiendaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TarjetaTiendaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaTiendaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
