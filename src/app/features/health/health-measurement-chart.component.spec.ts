import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthMeasurement } from '../../core/models/health.model';
import { HealthMeasurementChartComponent } from './health-measurement-chart.component';

describe('HealthMeasurementChartComponent', () => {
  let fixture: ComponentFixture<HealthMeasurementChartComponent>;
  const items: HealthMeasurement[] = [
    { id: '1', version: 0, petId: 3, type: 'WEIGHT', value: 4.2, unit: 'KILOGRAM', measuredAt: '2026-06-01T12:00:00Z', notes: null, createdByTutorId: 1 },
    { id: '2', version: 0, petId: 3, type: 'WEIGHT', value: 4.7, unit: 'KILOGRAM', measuredAt: '2026-07-01T12:00:00Z', notes: 'Em jejum', createdByTutorId: 1 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HealthMeasurementChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(HealthMeasurementChartComponent);
    fixture.componentRef.setInput('type', 'WEIGHT');
    fixture.componentRef.setInput('measurements', items);
    fixture.detectChanges();
  });

  it('renders the trend as a labelled image and an equivalent data table', () => {
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('2 medições');
    expect(fixture.nativeElement.querySelectorAll('circle.point').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('4,7 kg');
  });
});
