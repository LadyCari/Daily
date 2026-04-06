import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddHorarioComponent } from './horario.component';

describe('AddHorarioComponent', () => {
  let component: AddHorarioComponent;
  let fixture: ComponentFixture<AddHorarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AddHorarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHorarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
