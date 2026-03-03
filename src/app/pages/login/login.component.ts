import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  styleUrl: './login.component.scss',
  template: `
    <div class="page-layout">
      <app-header></app-header>

      <main class="auth-page">
        <div class="auth-card card">
          <div class="auth-card__logo">
            <span>📚</span>
            <h2>Learn<span>At</span>Home</h2>
          </div>

          <h1>Connexion</h1>
          <p class="subtitle">Bienvenue ! Connectez-vous pour accéder à votre espace.</p>

          <div class="error-banner" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>

          <form (ngSubmit)="login()" class="auth-form">
            <div class="form-group">
              <label>Adresse email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="votre@email.com"
                required
                [class.error]="emailError"
              >
              <span class="error-msg" *ngIf="emailError">Email invalide</span>
            </div>

            <div class="form-group">
              <label>Mot de passe</label>
              <div class="input-password">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  required
                >
                <button type="button" class="toggle-pwd" (click)="showPassword = !showPassword">
                  <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <a routerLink="/mot-de-passe-oublie" class="forgot-link">Mot de passe oublié ?</a>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading">
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">Se connecter</span>
            </button>
          </form>

          <p class="auth-footer">
            Pas encore de compte ? <a routerLink="/inscription">S'inscrire</a>
          </p>
        </div>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  showPassword = false;
  errorMessage = '';
  emailError = false;

  async login(): Promise<void> {
    this.errorMessage = '';
    this.emailError = false;

    if (!this.email || !this.isValidEmail(this.email)) {
      this.emailError = true;
      return;
    }

    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          this.errorMessage = 'Email ou mot de passe incorrect.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Trop de tentatives. Réessayez plus tard.';
          break;
        default:
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      }
    } finally {
      this.loading = false;
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
