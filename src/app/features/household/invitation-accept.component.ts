import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HouseholdInvitationPreview, roleLabel } from '../../core/models/household.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HouseholdService } from '../../core/services/household.service';

@Component({ selector: 'app-invitation-accept', standalone: true, imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule], template: `
  <section class="invite-card" aria-live="polite">
    @if (state === 'loading') {
      <mat-spinner diameter="38"></mat-spinner><h1>Validando seu convite…</h1><p>Estamos conferindo o link e o e-mail com segurança.</p>
    } @else if (state === 'preview' && preview) {
      <span class="icon invite"><mat-icon>group_add</mat-icon></span>
      <p class="overline">Convite para a família</p><h1>{{ preview.householdName }}</h1>
      <p><strong>{{ preview.inviterName }}</strong> convidou você para compartilhar a rotina dos pets.</p>
      <div class="role-card" [class.owner]="isOwner">
        <mat-icon>{{ isOwner ? 'admin_panel_settings' : preview.role === 'CAREGIVER' ? 'volunteer_activism' : 'visibility' }}</mat-icon>
        <div><span>Seu papel será</span><strong>{{ roleName }}</strong></div>
      </div>
      @if (isOwner) {
        <div class="owner-warning" role="note"><strong>Acesso administrativo completo</strong><span>Você poderá gerenciar pets, planos, finanças, pessoas e novos convites, com o mesmo nível dos demais proprietários.</span></div>
      }
      @if (acceptError) { <div class="accept-error" role="alert"><mat-icon>error_outline</mat-icon><span>{{ acceptError }}</span></div> }
      <p class="expiry">Convite válido até {{ preview.expiresAt | date:'dd/MM/yyyy, HH:mm' }}.</p>
      <div class="actions"><button mat-flat-button type="button" (click)="accept()">Aceitar e entrar na família</button><a mat-button routerLink="/today">Agora não</a></div>
    } @else if (state === 'accepting') {
      <mat-spinner diameter="38"></mat-spinner><h1>Entrando na família…</h1><p>Estamos concluindo o acesso compartilhado.</p>
    } @else if (state === 'success') {
      <span class="icon ok"><mat-icon>group</mat-icon></span><h1>Agora vocês cuidam juntos</h1><p>A família foi selecionada e os pets, cuidados e histórico compartilhados já estão disponíveis.</p>
      @if (refreshWarning) { <div class="refresh-warning" role="status"><mat-icon>sync_problem</mat-icon><span>{{ refreshWarning }}</span></div> }
      <a mat-flat-button routerLink="/family">Conhecer a família</a>
    } @else {
      <span class="icon error"><mat-icon>link_off</mat-icon></span><h1>Não foi possível aceitar o convite</h1><p>{{ message }}</p><a mat-stroked-button routerLink="/today">Voltar para hoje</a>
    }
  </section>
`, styles: [`:host{display:grid;place-items:center;min-height:60vh}.invite-card{width:min(100%,560px);text-align:center;background:var(--q-surface);border:1px solid var(--q-border);border-radius:24px;padding:clamp(24px,6vw,42px);box-shadow:var(--q-shadow-md);display:grid;justify-items:center;gap:14px}.invite-card h1,.invite-card p{margin:0}.invite-card>p{color:var(--q-text-2)}.invite-card .overline{color:var(--q-green-700);font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center}.icon.invite{background:var(--q-green-50);color:var(--q-green-700)}.icon.ok{background:var(--q-success-bg);color:var(--q-success)}.icon.error{background:var(--q-error-bg);color:var(--q-error)}.icon mat-icon{font-size:31px;width:31px;height:31px}.role-card{width:100%;display:flex;align-items:center;gap:12px;padding:14px;text-align:left;border:1px solid var(--q-border);border-radius:16px;background:var(--q-background)}.role-card.owner{border-color:var(--q-green-100);background:var(--q-green-50)}.role-card>mat-icon{color:var(--q-green-700)}.role-card div{display:grid}.role-card span{color:var(--q-text-2);font-size:.74rem}.role-card strong{color:var(--q-text-1)}.owner-warning{display:grid;gap:4px;width:100%;padding:14px;text-align:left;border-left:3px solid var(--q-green-600);border-radius:6px 14px 14px 6px;background:var(--q-green-50)}.owner-warning strong{color:var(--q-green-700);font-size:.84rem}.owner-warning span{color:var(--q-text-2);font-size:.78rem;line-height:1.5}.accept-error,.refresh-warning{width:100%;display:flex;align-items:flex-start;gap:9px;padding:12px 14px;text-align:left;border-radius:14px;font-size:.78rem;line-height:1.45}.accept-error{background:var(--q-error-bg);color:var(--q-error)}.refresh-warning{background:var(--q-green-50);color:var(--q-text-2)}.accept-error mat-icon,.refresh-warning mat-icon{width:19px;height:19px;flex:none;font-size:19px}.invite-card .expiry{font-size:.76rem}.actions{width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:4px}.actions button{flex:1 1 240px}.actions a{flex:0 0 auto}@media(max-width:480px){.invite-card{border-radius:18px}.actions{display:grid}.actions button,.actions a{width:100%}}`] })
export class InvitationAcceptComponent implements OnInit {
  state: 'loading' | 'preview' | 'accepting' | 'success' | 'error' = 'loading';
  message = '';
  acceptError = '';
  refreshWarning = '';
  preview: HouseholdInvitationPreview | null = null;
  private token = '';
  constructor(private route: ActivatedRoute, private households: HouseholdService, private apiError: ApiErrorService) {}

  get isOwner(): boolean { return this.preview?.role === 'OWNER'; }
  get roleName(): string { return this.preview ? roleLabel(this.preview.role) : ''; }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (this.token.length < 32 || this.token.length > 128) { this.state = 'error'; this.message = 'Este link de convite é inválido.'; return; }
    this.households.invitationPreview(this.token).subscribe({
      next: preview => { this.preview = preview; this.state = 'preview'; },
      error: error => { this.state = 'error'; this.message = this.apiError.message(error, 'O convite expirou, já foi usado ou pertence a outro e-mail.'); },
    });
  }

  accept(): void {
    if (this.state !== 'preview' || !this.token) return;
    this.acceptError = '';
    this.state = 'accepting';
    this.households.accept(this.token).subscribe({
      next: () => this.refreshAfterAccept(),
      error: error => {
        const fallback = this.isTransient(error)
          ? 'Não foi possível concluir agora. Confira sua conexão e tente novamente.'
          : 'O convite expirou, já foi usado ou pertence a outro e-mail.';
        const message = this.apiError.message(error, fallback);
        if (this.isTransient(error)) {
          this.acceptError = message;
          this.state = 'preview';
        } else {
          this.message = message;
          this.state = 'error';
        }
      },
    });
  }

  private refreshAfterAccept(): void {
    this.households.load().subscribe({
      next: () => { this.state = 'success'; },
      error: () => {
        this.refreshWarning = 'Seu acesso foi aceito, mas a atualização demorou. Ao abrir a família, tentaremos carregar novamente.';
        this.state = 'success';
      },
    });
  }

  private isTransient(error: unknown): boolean {
    const status = error instanceof HttpErrorResponse ? error.status : -1;
    return status === 0 || status === 408 || status === 429 || status >= 500;
  }
}
