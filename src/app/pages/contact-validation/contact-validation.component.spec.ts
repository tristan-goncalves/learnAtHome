jest.mock('@angular/fire/auth', () => ({
  Auth: class {},
  authState: jest.fn()
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import * as authFireModule from '@angular/fire/auth';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ContactValidationComponent } from './contact-validation.component';
import { AuthService } from '../../core/services/auth.service';
import { ContactRequestService } from '../../core/services/contact-request.service';

describe('ContactValidationComponent', () => {
  let component: ContactValidationComponent;
  let fixture: ComponentFixture<ContactValidationComponent>;
  let authSpy: { refreshCurrentUser: jest.Mock };
  let contactSpy: { acceptRequest: jest.Mock };
  let routerSpy: { navigate: jest.Mock };

  const mockFirebaseUser = { uid: 'uid-bob' };

  const createComponent = async (token: string | null) => {
    await TestBed.configureTestingModule({
      imports: [ContactValidationComponent],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: AuthService, useValue: authSpy },
        { provide: ContactRequestService, useValue: contactSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(ContactValidationComponent, {
        remove: { imports: [RouterModule] },
        add: { schemas: [NO_ERRORS_SCHEMA] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ContactValidationComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    authSpy = { refreshCurrentUser: jest.fn().mockResolvedValue(undefined) };
    contactSpy = { acceptRequest: jest.fn() };
    routerSpy = { navigate: jest.fn() };
    jest.clearAllMocks();
  });

  afterEach(() => TestBed.resetTestingModule());

  it("passe à l'état error si aucun token n'est fourni", async () => {
    (authFireModule.authState as jest.Mock).mockReturnValue(of(null));
    await createComponent(null);
    fixture.detectChanges();

    expect(component.state).toBe('error');
    expect(component.errorMsg).toContain('token');
  });

  it("redirige vers /connexion si l'utilisateur n'est pas authentifié", async () => {
    (authFireModule.authState as jest.Mock).mockReturnValue(of(null));
    await createComponent('valid-token');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/connexion'],
      expect.objectContaining({ queryParams: expect.any(Object) })
    );
  });

  it("passe à l'état success quand le token est valide et l'utilisateur est connecté", async () => {
    (authFireModule.authState as jest.Mock).mockReturnValue(of(mockFirebaseUser as any));
    contactSpy.acceptRequest.mockResolvedValue(undefined);
    await createComponent('valid-token');
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.state).toBe('success');
    expect(contactSpy.acceptRequest).toHaveBeenCalledWith('valid-token', 'uid-bob');
  });

  it("passe à l'état error avec le bon message pour REQUEST_INVALID", async () => {
    (authFireModule.authState as jest.Mock).mockReturnValue(of(mockFirebaseUser as any));
    contactSpy.acceptRequest.mockRejectedValue(new Error('REQUEST_INVALID'));
    await createComponent('expired-token');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.state).toBe('error');
    expect(component.errorMsg).toContain('déjà été utilisé');
  });
});
