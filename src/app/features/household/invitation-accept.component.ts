import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HouseholdService } from '../../core/services/household.service';

@Component({ selector: 'app-invitation-accept', standalone: true, imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule], template: `
  <section class="invite-card" aria-live="polite">
    @if (state === 'loading') { <mat-spinner diameter="38"></mat-spinner><h1>Entrando na rotina compartilhada…</h1><p>Estamos validando o convite com segurança.</p> }
    @else if (state === 'success') { <span class="icon ok"><mat-icon>group</mat-icon></span><h1>Agora vocês cuidam juntos</h1><p>A família foi selecionada e os pets, cuidados e histórico compartilhados já estão disponíveis.</p><a mat-flat-button routerLink="/family">Conhecer a família</a> }
    @else { <span class="icon error"><mat-icon>link_off</mat-icon></span><h1>Não foi possível aceitar</h1><p>{{ message }}</p><a mat-stroked-button routerLink="/today">Voltar para hoje</a> }
  </section>
`, styles: [`:host{display:grid;place-items:center;min-height:60vh}.invite-card{max-width:520px;text-align:center;background:var(--q-surface);border:1px solid var(--q-border);border-radius:24px;padding:42px;box-shadow:var(--q-shadow-md);display:grid;justify-items:center;gap:14px}.invite-card p{color:var(--q-text-2)}.icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center}.icon.ok{background:var(--q-success-bg);color:var(--q-success)}.icon.error{background:var(--q-error-bg);color:var(--q-error)}.icon mat-icon{font-size:31px;width:31px;height:31px}`] })
export class InvitationAcceptComponent implements OnInit {
  state: 'loading' | 'success' | 'error' = 'loading'; message = '';
  constructor(private route: ActivatedRoute, private households: HouseholdService, private apiError: ApiErrorService) {}
  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (token.length < 32 || token.length > 128) { this.state = 'error'; this.message = 'Este link de convite é inválido.'; return; }
    this.households.accept(token).subscribe({ next: () => { this.households.load().subscribe(); this.state = 'success'; }, error: error => { this.state = 'error'; this.message = this.apiError.message(error, 'O convite expirou, já foi usado ou pertence a outro e-mail.'); } });
  }
}
