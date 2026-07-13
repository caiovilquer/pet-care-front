import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { HEALTH_MEASUREMENT_META, HEALTH_RECORD_META, HealthRecordType } from '../../core/models/health.model';
import { PetSummary } from '../../core/models/pet.model';
import { VeterinaryRecord, VeterinaryShare, VeterinarySummary } from '../../core/models/veterinary-report.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HouseholdService } from '../../core/services/household.service';
import { PetService } from '../../core/services/pet.service';
import { ToastService } from '../../core/services/toast.service';
import { VeterinaryReportService } from '../../core/services/veterinary-report.service';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
import { HintComponent } from '../../shared/components/ui/hint.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';

@Component({
  selector: 'rp-veterinary-summary', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, PetAvatarComponent, HintComponent],
  templateUrl: './veterinary-summary.component.html', styleUrl: './veterinary-summary.component.css'
})
export class VeterinarySummaryComponent implements OnInit {
  readonly recordMeta = HEALTH_RECORD_META; readonly measurementMeta = HEALTH_MEASUREMENT_META;
  pets: PetSummary[] = []; selectedPetId: number | null = null; selectedMonths = 6;
  summary: VeterinarySummary | null = null; shares: VeterinaryShare[] = [];
  loading = true; sharing = false; owner = false; oneTimeLink: string | null = null;
  readonly shareForm;

  constructor(
    fb: FormBuilder, private readonly reports: VeterinaryReportService, private readonly petService: PetService,
    private readonly households: HouseholdService, private readonly route: ActivatedRoute,
    private readonly toast: ToastService, private readonly errors: ApiErrorService, private readonly dialog: MatDialog,
  ) {
    this.shareForm = fb.nonNullable.group({
      label: ['Consulta veterinária', [Validators.required, Validators.maxLength(100)]],
      expiresInHours: [24, Validators.required], includeNotes: [false], includeCosts: [false], includeDocuments: [false],
    });
  }
  ngOnInit(): void {
    const queryPet = Number(this.route.snapshot.queryParamMap.get('petId'));
    this.households.overview().subscribe({ next: context => {
      this.owner = context.household.role === 'OWNER';
      this.petService.getAllCached(0, 100).subscribe({
        next: page => {
          this.pets = page.items; this.selectedPetId = this.pets.some(p => p.id === queryPet) ? queryPet : this.pets[0]?.id || null;
          this.load();
        }, error: e => this.fail(e, 'Não foi possível carregar os pets.'),
      });
    }, error: e => this.fail(e, 'Não foi possível carregar a família.') });
  }
  load(): void {
    this.oneTimeLink = null;
    if (!this.selectedPetId) { this.summary = null; this.loading = false; return; }
    this.loading = true; const range = this.range();
    this.reports.summary(this.selectedPetId, range.from, range.to).subscribe({
      next: value => { this.summary = value; this.loading = false; if (this.owner) this.loadShares(); },
      error: e => this.fail(e, 'Não foi possível gerar o resumo veterinário.'),
    });
  }
  createShare(): void {
    if (!this.summary || this.shareForm.invalid) { this.shareForm.markAllAsTouched(); return; }
    const value = this.shareForm.getRawValue(); this.sharing = true;
    this.reports.createShare({
      petId: this.summary.pet.id, label: value.label.trim(), from: this.summary.from, to: this.summary.to,
      expiresInHours: Number(value.expiresInHours), includeNotes: value.includeNotes,
      includeCosts: value.includeCosts, includeDocuments: value.includeDocuments,
    }).subscribe({
      next: created => {
        this.sharing = false; this.oneTimeLink = `${location.origin}/shared/veterinary#${encodeURIComponent(created.token)}`;
        this.toast.success('Link seguro criado. Ele será mostrado apenas agora.'); this.loadShares();
      }, error: e => { this.sharing = false; this.toast.error(this.errors.message(e, 'Não foi possível criar o link.')); },
    });
  }
  copyLink(): void {
    if (!this.oneTimeLink) return;
    navigator.clipboard?.writeText(this.oneTimeLink).then(() => this.toast.success('Link copiado.')).catch(() => this.fallbackCopy());
  }
  revoke(share: VeterinaryShare): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Revogar este link?', message: 'Quem recebeu o link perderá o acesso imediatamente.', confirmLabel: 'Revogar link', danger: true } })
      .afterClosed().subscribe(ok => { if (!ok) return; this.reports.revoke(share).subscribe({ next: () => { this.toast.success('Link revogado.'); this.loadShares(); }, error: e => this.toast.error(this.errors.message(e, 'Não foi possível revogar.')) }); });
  }
  records(type: HealthRecordType): VeterinaryRecord[] { return this.summary?.records.filter(item => item.type === type) || []; }
  get selectedPet(): PetSummary | undefined { return this.pets.find(pet => pet.id === this.summary?.pet.id); }
  openDocument(mediaId: string): void { this.reports.attachmentUrl(mediaId).subscribe({ next: value => this.open(value.url), error: e => this.toast.error(this.errors.message(e, 'Não foi possível abrir o documento.')) }); }
  print(): void { window.print(); }
  date(value: string): string { return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  dateTime(value: string): string { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }); }
  money(value?: number | null, currency = 'BRL'): string { return value == null ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value); }
  bytes(value: number): string { return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }
  shareStatus(item: VeterinaryShare): string { return item.revokedAt ? 'Revogado' : new Date(item.expiresAt) <= new Date() ? 'Expirado' : 'Ativo'; }
  private loadShares(): void { this.reports.shares(this.selectedPetId || undefined).subscribe({ next: items => this.shares = items, error: e => this.toast.error(this.errors.message(e, 'Não foi possível carregar os links.')) }); }
  private range() { const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth() - this.selectedMonths + 1, 1); return { from: this.localDate(from), to: this.localDate(now) }; }
  private localDate(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
  private fallbackCopy(): void { const input = document.createElement('textarea'); input.value = this.oneTimeLink || ''; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); this.toast.success('Link copiado.'); }
  private open(url: string): void { const anchor = document.createElement('a'); anchor.href = url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); }
  private fail(error: unknown, message: string): void { this.loading = false; this.toast.error(this.errors.message(error, message)); }
}
