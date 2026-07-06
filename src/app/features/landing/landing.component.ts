import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Tile {
  label: string;
  type: 'vaccine' | 'medicine' | 'diary' | 'breed' | 'service' | 'empty';
  span: 1 | 2;
  rotated?: boolean;
}

interface LifePoint {
  age: string;
  text: string;
  side: 'left' | 'right';
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef<HTMLElement>>;

  isDark = false;
  currentYear = new Date().getFullYear();

  readonly tiles: Tile[] = [
    { label: 'Vacinas', type: 'vaccine', span: 2 },
    { label: 'Medicamentos', type: 'medicine', span: 1 },
    { label: '', type: 'empty', span: 1 },
    { label: 'Diário', type: 'diary', span: 1 },
    { label: 'Reprodução', type: 'breed', span: 1, rotated: true },
    { label: 'Serviços', type: 'service', span: 2 },
    { label: '', type: 'empty', span: 2 },
    { label: 'Lembretes', type: 'vaccine', span: 1 },
    { label: 'Diário', type: 'diary', span: 1 }
  ];

  readonly lifePoints: LifePoint[] = [
    { age: 'filhote', text: 'A primeira vacina, o primeiro nome na agenda.', side: 'left' },
    { age: 'adulta', text: 'A rotina vira hábito: passeio, ração, remédio, sempre na hora certa.', side: 'right' },
    { age: 'uma ninhada', text: 'Uma nova vida chega, e o histórico dela começa junto.', side: 'left' },
    { age: 'anos grisalhos', text: 'Anos de cuidado, num só lugar — pronto para mostrar ao veterinário.', side: 'right' }
  ];

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.isDark = this.resolveIsDark();
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    this.revealEls.forEach(el => this.observer?.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  toggleTheme(): void {
    const next = this.isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('rp-theme', next);
    } catch {
      /* localStorage indisponível */
    }
    this.isDark = next === 'dark';
  }

  private resolveIsDark(): boolean {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
