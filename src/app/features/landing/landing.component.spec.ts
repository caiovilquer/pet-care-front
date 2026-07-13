import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('explains the product and exposes a clear primary action', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('h1').length).toBe(1);
    expect(root.querySelector('h1')?.textContent).toContain('A rotina do seu pet');
    expect(root.querySelector('main#conteudo-principal')).not.toBeNull();
    expect(root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#conteudo-principal');
    expect(root.querySelector('a.button-primary')?.getAttribute('href')).toBe('/auth/signup');
  });

  it('represents the current shared, clinical and financial capabilities', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const copy = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(copy).toContain('Mais de um proprietário');
    expect(copy).toContain('Cuidador');
    expect(copy).toContain('Visualizador');
    expect(copy).toContain('link temporário');
    expect(copy).toContain('BRL');
    expect(copy).toContain('USD');
    expect(copy).toContain('EUR');
    expect(copy).toContain('GBP');
  });

  it('does not repeat unsupported promises from the old story', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const copy = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(copy).not.toContain('sempre em dia');
    expect(copy).not.toContain('uma ninhada');
    expect(copy).toContain('não substitui a avaliação veterinária');
    expect(copy).toContain('sem conversão automática');
  });
});
