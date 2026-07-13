import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LandingFeaturesComponent } from './landing-features.component';
import { LandingClosingComponent } from './landing-closing.component';

type CareTone = 'medicine' | 'service' | 'vaccine' | 'diary';

interface RoutineMoment {
  time: string;
  icon: string;
  title: string;
  description: string;
  meta: string;
  tone: CareTone;
  done?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LandingFeaturesComponent, LandingClosingComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef<HTMLElement>>;

  isDark = false;
  topbarScrolled = false;
  currentYear = new Date().getFullYear();

  readonly routineMoments: RoutineMoment[] = [
    {
      time: '08:00',
      icon: 'medication',
      title: 'A dose da manhã',
      description: 'O responsável recebe o lembrete por e-mail e encontra a orientação no cuidado.',
      meta: 'Confirmado por Ana',
      tone: 'medicine',
      done: true
    },
    {
      time: '12:00',
      icon: 'directions_walk',
      title: 'O passeio do meio-dia',
      description: 'A rotina recorrente já aparece no dia certo, para a pessoa certa.',
      meta: 'Responsável: João',
      tone: 'service'
    },
    {
      time: '15:30',
      icon: 'vaccines',
      title: 'A consulta da tarde',
      description: 'O próximo compromisso fica visível junto de tudo o que precisa acompanhar a Pipoca.',
      meta: 'Clínica do bairro',
      tone: 'vaccine'
    },
    {
      time: '20:00',
      icon: 'edit_note',
      title: 'Um detalhe antes de dormir',
      description: 'Quem cuidou registra o que observou e deixa contexto para a próxima pessoa.',
      meta: 'Passagem de turno',
      tone: 'diary'
    }
  ];

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.applyLandingTheme();
    this.topbarScrolled = typeof window !== 'undefined' && window.scrollY > 12;
  }

  ngAfterViewInit(): void {
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.revealEls.forEach(el => el.nativeElement.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    this.revealEls.forEach(el => this.observer?.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.topbarScrolled = window.scrollY > 12;
  }

  setTheme(mode: 'light' | 'dark'): void {
    if ((mode === 'dark') === this.isDark) return;

    document.documentElement.setAttribute('data-theme', mode);
    try {
      localStorage.setItem('rp-theme', mode);
    } catch {
      /* localStorage indisponível */
    }
    this.isDark = mode === 'dark';
  }

  toggleTheme(): void {
    this.setTheme(this.isDark ? 'light' : 'dark');
  }

  private applyLandingTheme(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('rp-theme');
    } catch {
      /* localStorage indisponível */
    }

    const mode = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    this.isDark = mode === 'dark';
  }
}
