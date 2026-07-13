import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HouseholdService } from '../../core/services/household.service';
import { InvitationAcceptComponent } from './invitation-accept.component';

describe('InvitationAcceptComponent', () => {
  let fixture: ComponentFixture<InvitationAcceptComponent>;
  let households: jasmine.SpyObj<HouseholdService>;
  let apiError: jasmine.SpyObj<ApiErrorService>;

  beforeEach(async () => {
    households = jasmine.createSpyObj<HouseholdService>('HouseholdService', ['invitationPreview', 'accept', 'load']);
    households.invitationPreview.and.returnValue(of({
      householdName: 'Casa da Ana', inviterName: 'Ana', role: 'OWNER', expiresAt: '2026-07-20T12:00:00Z',
    }));
    households.accept.and.returnValue(of({ householdId: 'household-1' }));
    households.load.and.returnValue(of([]));
    apiError = jasmine.createSpyObj<ApiErrorService>('ApiErrorService', ['message']);
    apiError.message.and.callFake((_error, fallback) => fallback || 'Não foi possível concluir a ação.');

    await TestBed.configureTestingModule({
      imports: [InvitationAcceptComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'a'.repeat(43) }) } } },
        { provide: HouseholdService, useValue: households },
        { provide: ApiErrorService, useValue: apiError },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvitationAcceptComponent);
    fixture.detectChanges();
  });

  it('shows the owner privileges and waits for explicit confirmation', () => {
    expect(households.invitationPreview).toHaveBeenCalledWith('a'.repeat(43));
    expect(households.accept).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Acesso administrativo completo');

    fixture.componentInstance.accept();

    expect(households.accept).toHaveBeenCalledWith('a'.repeat(43));
    expect(fixture.componentInstance.state).toBe('success');
  });

  it('keeps the preview available when accepting fails temporarily', () => {
    households.accept.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    fixture.componentInstance.accept();
    fixture.detectChanges();

    expect(fixture.componentInstance.state).toBe('preview');
    expect(fixture.nativeElement.textContent).toContain('tente novamente');
  });

  it('confirms the accepted invitation and handles a refresh failure', () => {
    households.load.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

    fixture.componentInstance.accept();
    fixture.detectChanges();

    expect(fixture.componentInstance.state).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('Seu acesso foi aceito');
  });
});
