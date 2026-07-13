import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-closing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-closing.component.html',
  styleUrl: './landing-closing.component.css'
})
export class LandingClosingComponent implements AfterViewInit, OnDestroy {
  @Input() isDark = false;
  @Input() currentYear = new Date().getFullYear();
  @Output() themeToggle = new EventEmitter<void>();
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef<HTMLElement>>;

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
