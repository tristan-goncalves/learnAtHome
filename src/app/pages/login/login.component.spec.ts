import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: { login: jest.Mock };
  let routerSpy: { navigate: jest.Mock };

  beforeEach(async () => {
    authSpy = { login: jest.fn() };
    routerSpy = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(LoginComponent, {
        remove: { imports: [HeaderComponent, FooterComponent, RouterModule] },
        add: { schemas: [NO_ERRORS_SCHEMA] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('isValidEmail() retourne true pour un email valide et false sinon', () => {
    expect(component.isValidEmail('user@example.com')).toBe(true);
    expect(component.isValidEmail('pas-un-email')).toBe(false);
  });

  it("login() ne pas appeler le service si l'email est invalide", async () => {
    component.email = 'mauvais-email';
    component.password = 'password123';

    await component.login();

    expect(component.emailError).toBe(true);
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('login() navigue vers /dashboard en cas de succès', async () => {
    authSpy.login.mockResolvedValue(undefined);
    component.email = 'test@test.com';
    component.password = 'password123';

    await component.login();

    expect(authSpy.login).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
