import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FinanceComponent } from './finance.component';
import { VeterinarySummaryComponent } from './veterinary-summary.component';

@Component({
  selector: 'app-care-center', standalone: true,
  imports: [MatIconModule, MatTabsModule, VeterinarySummaryComponent, FinanceComponent],
  template: `
    <header class="center-hero"><div><p class="q-overline">Decisões com contexto</p><h1>Central de cuidado</h1><p>Leve um histórico claro à consulta e enxergue custos futuros sem misturar fatos, previsões ou recomendações.</p></div><span><mat-icon>shield</mat-icon>Privado por padrão</span></header>
    <mat-tab-group animationDuration="180ms" dynamicHeight preserveContent>
      <mat-tab><ng-template mat-tab-label><mat-icon>clinical_notes</mat-icon><span>Resumo veterinário</span></ng-template><div class="tab-content"><rp-veterinary-summary></rp-veterinary-summary></div></mat-tab>
      <mat-tab><ng-template mat-tab-label><mat-icon>account_balance_wallet</mat-icon><span>Finanças</span></ng-template><div class="tab-content"><rp-finance></rp-finance></div></mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .center-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:12px 0 24px}.center-hero h1{font:700 clamp(2rem,5vw,3.3rem)/1 var(--q-font-display);letter-spacing:-.04em;margin:4px 0}.center-hero p{max-width:720px;color:var(--q-text-2);margin:0}.center-hero>span{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:99px;background:var(--q-green-50);color:var(--q-green-700);font-size:.75rem;font-weight:700;white-space:nowrap}.center-hero>span mat-icon{font-size:18px;width:18px;height:18px}.tab-content{padding:26px 2px 4px}mat-tab-group mat-icon{margin-right:7px}@media(max-width:620px){.center-hero{flex-direction:column}.center-hero>span{order:-1}.tab-content{padding-top:18px}}
    :host ::ng-deep .mat-mdc-tab{min-width:0!important;flex:1 1 0}:host ::ng-deep .mat-mdc-tab-header-pagination{display:none!important}
    @media print{.center-hero{display:none}:host ::ng-deep .mat-mdc-tab-header{display:none}}
  `]
})
export class CareCenterComponent {}
