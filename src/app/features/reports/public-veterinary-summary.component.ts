import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HEALTH_MEASUREMENT_META, HEALTH_RECORD_META } from '../../core/models/health.model';
import { PublicVeterinarySummary } from '../../core/models/veterinary-report.model';
import { VeterinaryReportService } from '../../core/services/veterinary-report.service';

@Component({
  selector: 'app-public-veterinary-summary', standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './public-veterinary-summary.component.html', styleUrl: './public-veterinary-summary.component.css'
})
export class PublicVeterinarySummaryComponent implements OnInit {
  readonly recordMeta = HEALTH_RECORD_META; readonly measurementMeta = HEALTH_MEASUREMENT_META;
  value: PublicVeterinarySummary | null = null; loading = true; invalid = false;
  private token = '';
  constructor(private readonly route: ActivatedRoute, private readonly reports: VeterinaryReportService) {}
  ngOnInit(): void {
    let token = '';
    try { token = this.route.snapshot.fragment ? decodeURIComponent(this.route.snapshot.fragment) : ''; }
    catch { this.loading = false; this.invalid = true; return; }
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) { this.loading = false; this.invalid = true; return; }
    this.token = token;
    window.setTimeout(() => window.history.replaceState(
      window.history.state, '', `${window.location.pathname}${window.location.search}`,
    ));
    this.reports.publicSummary(token).subscribe({ next: value => { this.value = value; this.loading = false; }, error: () => { this.loading = false; this.invalid = true; } });
  }
  openDocument(mediaId: string): void {
    this.reports.sharedAttachmentUrl(this.token, mediaId).subscribe({ next: value => {
      const anchor = document.createElement('a'); anchor.href = value.url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
    }});
  }
  print(): void { window.print(); }
  date(value: string): string { return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  dateTime(value: string): string { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }); }
  money(value?: number | null, currency = 'BRL'): string { return value == null ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value); }
  bytes(value: number): string { return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }
}
