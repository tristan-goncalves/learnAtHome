import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: { register: jest.Mock };
  let routerSpy: { navigate: jest.Mock };

  beforeEach(async () => {
    authSpy = { register: jest.fn() };
    routerSpy = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(RegisterComponent, {
        remove: { imports: [HeaderComponent, FooterComponent, RouterModule] },
        add: { schemas: [NO_ERRORS_SCHEMA] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it("register() définit emailError si l'email est invalide", async () => {
    component.email = 'invalide';
    component.password = 'password123';
    component.confirmPassword = 'password123';

    await component.register();

    expect(component.emailError).toBe(true);
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('register() définit confirmError si les mots de passe ne correspondent pas', async () => {
    component.email = 'test@test.com';
    component.password = 'password123';
    component.confirmPassword = 'different123';

    await component.register();

    expect(component.confirmError).toBe(true);
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('register() navigue vers /dashboard après une inscription réussie', async () => {
    authSpy.register.mockResolvedValue(undefined);
    component.email = 'test@test.com';
    component.password = 'password123';
    component.confirmPassword = 'password123';
    component.firstName = 'Jean';
    component.lastName = 'Dupont';
    component.role = 'tutor';

    await component.register();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
