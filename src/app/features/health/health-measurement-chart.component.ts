import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HEALTH_MEASUREMENT_META, HealthMeasurement, HealthMeasurementType } from '../../core/models/health.model';

interface ChartPoint { x: number; y: number; item: HealthMeasurement }

@Component({
  selector: 'rp-health-measurement-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './health-measurement-chart.component.html',
  styleUrls: ['./health-measurement-chart.component.css']
})
export class HealthMeasurementChartComponent implements OnChanges {
  @Input({ required: true }) measurements: HealthMeasurement[] = [];
  @Input({ required: true }) type: HealthMeasurementType = 'WEIGHT';
  readonly meta = HEALTH_MEASUREMENT_META;
  readonly width = 640;
  readonly height = 230;
  readonly plot = { left: 46, right: 20, top: 20, bottom: 38 };
  points: ChartPoint[] = [];
  polyline = '';
  minValue = 0;
  maxValue = 1;
  yTicks: number[] = [];

  ngOnChanges(): void { this.build(); }

  get latest(): HealthMeasurement | null { return this.measurements.length ? this.sorted[this.sorted.length - 1] : null; }
  get sorted(): HealthMeasurement[] {
    return [...this.measurements].filter(item => item.type === this.type)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }
  get accessibleSummary(): string {
    const items = this.sorted;
    if (!items.length) return `Nenhuma medição de ${this.meta[this.type].label.toLowerCase()}.`;
    const first = items[0]; const last = items[items.length - 1];
    const variation = Number(last.value) - Number(first.value);
    return `${items.length} medições. Primeira: ${this.value(first.value)} em ${this.date(first.measuredAt)}. ` +
      `Mais recente: ${this.value(last.value)} em ${this.date(last.measuredAt)}. ` +
      `Variação no período: ${variation > 0 ? 'mais ' : ''}${this.value(variation)}.`;
  }

  tickY(value: number): number { return this.toY(value); }
  value(value: number): string {
    const fraction = this.type === 'BODY_CONDITION_SCORE' ? 0 : 1;
    return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: fraction })} ${this.meta[this.type].shortUnit}`;
  }
  date(value: string): string { return new Date(value).toLocaleDateString('pt-BR'); }
  dateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  private build(): void {
    const items = this.sorted;
    if (!items.length) { this.points = []; this.polyline = ''; this.yTicks = []; return; }
    const values = items.map(item => Number(item.value));
    const rawMin = Math.min(...values); const rawMax = Math.max(...values);
    const padding = rawMin === rawMax ? Math.max(Math.abs(rawMin) * .08, 1) : (rawMax - rawMin) * .12;
    this.minValue = rawMin - padding;
    this.maxValue = rawMax + padding;
    this.yTicks = [this.maxValue, (this.minValue + this.maxValue) / 2, this.minValue];
    const usableWidth = this.width - this.plot.left - this.plot.right;
    this.points = items.map((item, index) => ({
      x: items.length === 1 ? this.plot.left + usableWidth / 2 : this.plot.left + index * usableWidth / (items.length - 1),
      y: this.toY(Number(item.value)),
      item
    }));
    this.polyline = this.points.map(point => `${point.x},${point.y}`).join(' ');
  }

  private toY(value: number): number {
    const usableHeight = this.height - this.plot.top - this.plot.bottom;
    return this.plot.top + (this.maxValue - value) / (this.maxValue - this.minValue) * usableHeight;
  }
}
