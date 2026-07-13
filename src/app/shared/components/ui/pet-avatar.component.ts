import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar de pet com a moldura orgânica da marca.
 * Fallback: inicial do nome sobre gradiente por espécie.
 */
@Component({
  selector: 'rp-pet-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rp-avatar" [class]="'size-' + size + ' organic-' + organicVariant">
      @if (photoUrl && !imageFailed) {
        <img [src]="photoUrl" [alt]="'Foto de ' + name" (error)="imageFailed = true">
      } @else {
        <span class="initial" [style.background]="gradient">{{ initial }}</span>
      }
    </div>
  `,
  styles: [`
    .rp-avatar {
      display: inline-block;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--q-surface-3);
    }
    .rp-avatar.organic-1 { border-radius: var(--q-organic-1); }
    .rp-avatar.organic-2 { border-radius: var(--q-organic-2); }
    .rp-avatar.organic-3 { border-radius: var(--q-organic-3); }
    .size-sm { width: 36px; height: 36px; }
    .size-md { width: 52px; height: 52px; }
    .size-lg { width: 72px; height: 72px; }
    .size-xl { width: 112px; height: 112px; }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .initial {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      color: #fff;
      font-family: var(--q-font-display);
      font-weight: 700;
    }
    .size-sm .initial { font-size: 0.9rem; }
    .size-md .initial { font-size: 1.2rem; }
    .size-lg .initial { font-size: 1.7rem; }
    .size-xl .initial { font-size: 2.6rem; }
  `]
})
export class PetAvatarComponent implements OnChanges {
  @Input() name = '';
  @Input() species = '';
  @Input() photoUrl?: string | null;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  /** Índice do pet na lista — alterna a variação da moldura orgânica */
  @Input() seed = 0;

  imageFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photoUrl']) this.imageFailed = false;
  }

  private static readonly GRADIENTS: Record<string, string> = {
    'Cão': 'linear-gradient(140deg, #35705A, #1B4033)',
    'Gato': 'linear-gradient(140deg, #DFA32E, #B07818)',
    'Pássaro': 'linear-gradient(140deg, #3E7CA6, #29567A)',
    'Peixe': 'linear-gradient(140deg, #38709B, #234B6B)',
    'Hamster': 'linear-gradient(140deg, #B34A38, #8A3628)',
    'Coelho': 'linear-gradient(140deg, #B04A72, #8A3457)'
  };

  get organicVariant(): number {
    return (this.seed % 3) + 1;
  }

  get initial(): string {
    return (this.name || '?').charAt(0).toUpperCase();
  }

  get gradient(): string {
    return PetAvatarComponent.GRADIENTS[this.species]
      || 'linear-gradient(140deg, #35705A, #1B4033)';
  }
}
