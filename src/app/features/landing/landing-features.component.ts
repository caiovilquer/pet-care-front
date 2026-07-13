import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface HouseholdRole {
  icon: string;
  title: string;
  description: string;
  detail: string;
}

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-features.component.html',
  styleUrl: './landing-features.component.css'
})
export class LandingFeaturesComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef<HTMLElement>>;

  readonly householdRoles: HouseholdRole[] = [
    {
      icon: 'admin_panel_settings',
      title: 'Proprietário',
      description: 'Administra pets, planos, pessoas e finanças.',
      detail: 'Pode haver mais de um na mesma família.'
    },
    {
      icon: 'volunteer_activism',
      title: 'Cuidador',
      description: 'Confirma cuidados e registra informações de saúde.',
      detail: 'Participa da rotina sem alterar a administração.'
    },
    {
      icon: 'visibility',
      title: 'Visualizador',
      description: 'Acompanha a rotina e o histórico sem fazer alterações.',
      detail: 'Ideal para quem precisa apenas ficar por dentro.'
    }
  ];

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.revealEls.forEach(el => el.nativeElement.classList.add('is-visible'));
      return;
    }
    this.observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer?.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    this.revealEls.forEach(el => this.observer?.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
