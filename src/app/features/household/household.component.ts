import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs';
import { HouseholdMember, HouseholdOverview, HouseholdRole, roleLabel } from '../../core/models/household.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HouseholdService } from '../../core/services/household.service';
import { MediaService } from '../../core/services/media.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
import { HintComponent } from '../../shared/components/ui/hint.component';

@Component({
  selector: 'app-household', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatTooltipModule, HintComponent],
  templateUrl: './household.component.html', styleUrl: './household.component.css'
})
export class HouseholdComponent implements OnInit {
  overview: HouseholdOverview | null = null;
  loading = true; saving = false;
  currentTutorId: number | null = null;
  readonly inviteRoles: ReadonlyArray<{ value: HouseholdRole; label: string }> = [
    { value: 'OWNER', label: 'Proprietário — acesso total e administração' },
    { value: 'CAREGIVER', label: 'Cuidador — registra cuidados e saúde' },
    { value: 'VIEWER', label: 'Visualizador — somente consulta' },
  ];
  readonly inviteForm;
  readonly handoffForm;
  readonly timezoneForm;

  constructor(
    private fb: FormBuilder,
    private households: HouseholdService,
    private toast: ToastService,
    private apiError: ApiErrorService,
    private auth: AuthService,
    private dialog: MatDialog,
    private media: MediaService,
  ) {
    this.inviteForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]], role: ['CAREGIVER' as HouseholdRole, Validators.required] });
    this.handoffForm = this.fb.group({ toTutorId: this.fb.control<number | null>(null), note: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]) });
    this.timezoneForm = this.fb.nonNullable.group({ timezone: ['', [Validators.required, Validators.maxLength(64)]] });
  }
  ngOnInit(): void {
    this.auth.currentUser$.pipe(take(1)).subscribe(user => {
      const id = Number(user?.id);
      this.currentTutorId = Number.isSafeInteger(id) ? id : null;
    });
    this.reload();
  }
  get isOwner(): boolean { return this.overview?.household.role === 'OWNER'; }
  get canCare(): boolean { return this.overview?.household.role !== 'VIEWER'; }
  get isInvitingOwner(): boolean { return this.inviteForm.controls.role.value === 'OWNER'; }
  label(role: HouseholdRole): string { return roleLabel(role); }
  initials(member: HouseholdMember): string { return `${member.firstName[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase(); }
  private readonly failedAvatars = new Set<string>();
  avatarUrl(member: HouseholdMember): string | null {
    if (!member.avatarAssetId || this.failedAvatars.has(member.avatarAssetId)) { return null; }
    return this.media.contentUrl(member.avatarAssetId);
  }
  avatarFailed(member: HouseholdMember): void { if (member.avatarAssetId) { this.failedAvatars.add(member.avatarAssetId); } }
  isLastOwner(member: HouseholdMember): boolean {
    return member.role === 'OWNER' && this.overview?.members.filter(item => item.role === 'OWNER').length === 1;
  }
  cannotRemove(member: HouseholdMember): boolean {
    return this.isLastOwner(member) || member.tutorId === this.currentTutorId;
  }

  invite(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.saving = true;
    const value = this.inviteForm.getRawValue();
    this.households.invite(value.email.trim(), value.role).subscribe({
      next: () => { this.toast.success(`Convite enviado. A pessoa entrará como ${this.label(value.role).toLocaleLowerCase('pt-BR')}.`); this.inviteForm.reset({ email: '', role: 'CAREGIVER' }); this.reload(); },
      error: error => this.fail(error, 'Não foi possível enviar o convite.')
    });
  }
  changeRole(member: HouseholdMember, role: HouseholdRole): void {
    if (member.version == null || member.role === role) return;
    this.saving = true;
    this.households.changeRole(member.id, member.version, role).subscribe({ next: () => { this.toast.success('Permissão atualizada.'); this.reload(); }, error: e => this.fail(e, 'Não foi possível alterar a permissão.') });
  }
  remove(member: HouseholdMember): void {
    if (this.cannotRemove(member)) return;
    this.dialog.open(ConfirmDialogComponent, { data: {
      title: `Remover ${member.firstName} da família?`,
      message: 'Essa pessoa perderá o acesso aos pets, cuidados e registros desta família. O histórico das ações será preservado.',
      confirmLabel: 'Remover acesso', danger: true,
    }}).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.saving = true;
      this.households.removeMember(member.id).subscribe({
        next: () => { this.toast.success('Acesso removido com segurança.'); this.reload(); },
        error: e => this.fail(e, 'Não foi possível remover o membro.'),
      });
    });
  }
  revoke(id: string): void {
    this.saving = true; this.households.revokeInvitation(id).subscribe({ next: () => { this.toast.success('Convite cancelado.'); this.reload(); }, error: e => this.fail(e, 'Não foi possível cancelar o convite.') });
  }
  handoff(): void {
    if (this.handoffForm.invalid) { this.handoffForm.markAllAsTouched(); return; }
    const value = this.handoffForm.getRawValue(); this.saving = true;
    this.households.handoff(value.note.trim(), value.toTutorId).subscribe({
      next: () => { this.toast.success('Passagem de turno registrada para toda a família.'); this.handoffForm.reset({ note: '', toTutorId: null }); this.reload(); },
      error: e => this.fail(e, 'Não foi possível registrar a passagem de turno.')
    });
  }
  useBrowserTimezone(): void {
    this.timezoneForm.controls.timezone.setValue(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  saveTimezone(): void {
    if (!this.overview || this.timezoneForm.invalid) { this.timezoneForm.markAllAsTouched(); return; }
    this.saving = true;
    this.households.updateTimezone(this.overview.household, this.timezoneForm.controls.timezone.value.trim()).subscribe({
      next: household => { this.overview = { ...this.overview!, household }; this.saving = false; this.toast.success('Fuso horário da família atualizado.'); },
      error: error => this.fail(error, 'Não foi possível atualizar o fuso horário.')
    });
  }
  private reload(): void {
    this.loading = true;
    this.households.overview().subscribe({ next: value => { this.overview = value; this.timezoneForm.patchValue({ timezone: value.household.timezone || '' }); this.loading = false; this.saving = false; }, error: e => { this.loading = false; this.fail(e, 'Não foi possível carregar a família.'); } });
  }
  private fail(error: unknown, fallback: string): void { this.saving = false; this.toast.error(this.apiError.message(error, fallback)); }
}
