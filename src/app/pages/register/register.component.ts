import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  styleUrl: './register.component.scss',
  template: `
    <div class="page-layout">
      <app-header></app-header>

      <main class="auth-page">
        <div class="auth-card card">
          <div class="auth-card__logo">
            <img class="card-logo-icon" src="assets/icons/dragonball_4_etoiles.png" alt="LearnAtHome">
            <h2>Learn<span>At</span>Home</h2>
          </div>

          <h1>Créer un compte</h1>
          <p class="subtitle">Rejoignez la communauté LearnAtHome. C'est gratuit !</p>

          <div class="error-banner" *ngIf="errorMessage">⚠️ {{ errorMessage }}</div>

          <form (ngSubmit)="register()" class="auth-form">

            <!-- Sélecteur du rôle de l'utilisateur -->
            <div class="role-selector">
              <button type="button" class="role-btn" [class.active]="role === 'student'" (click)="role = 'student'">
                <img class="role-icon" src="assets/icons/gohan_student.png" alt="Élève">
                <span>Je suis élève</span>
              </button>
              <button type="button" class="role-btn" [class.active]="role === 'tutor'" (click)="role = 'tutor'">
                <img class="role-icon" src="assets/icons/piccolo_teacher.png" alt="Tuteur">
                <span>Je suis tuteur</span>
              </button>
            </div>

            <!-- Email du tuteur (uniquement pour les élèves) -->
            <div class="form-group" *ngIf="role === 'student'">
              <label>Email du tuteur *</label>
              <input type="email" [(ngModel)]="tutorEmail" name="tutorEmail"
                     placeholder="tuteur@email.com" required [class.error]="tutorEmailError">
              <span class="error-msg" *ngIf="tutorEmailError">Email du tuteur invalide ou introuvable</span>
            </div>

            <div class="name-row">
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" [(ngModel)]="firstName" name="firstName" placeholder="Marie" required>
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" [(ngModel)]="lastName" name="lastName" placeholder="Dupont" required>
              </div>
            </div>

            <div class="form-group">
              <label>Adresse email *</label>
              <input type="email" [(ngModel)]="email" name="email"
                     placeholder="votre@email.com" required [class.error]="emailError">
              <span class="error-msg" *ngIf="emailError">Email invalide</span>
            </div>

            <div class="form-group">
              <label>Mot de passe *</label>
              <div class="input-password">
                <input [type]="showPassword ? 'text' : 'password'"
                       [(ngModel)]="password" name="password"
                       placeholder="8 caractères minimum" required [class.error]="passwordError">
                <button type="button" class="toggle-pwd" (click)="showPassword = !showPassword">
                  <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <span class="error-msg" *ngIf="passwordError">Minimum 8 caractères</span>
            </div>

            <div class="form-group">
              <label>Confirmer le mot de passe *</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword"
                     placeholder="••••••••" required [class.error]="confirmError">
              <span class="error-msg" *ngIf="confirmError">Les mots de passe ne correspondent pas</span>
            </div>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading">
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">Créer mon compte</span>
            </button>
          </form>

          <p class="auth-footer">
            Déjà un compte ? <a routerLink="/connexion">Se connecter</a>
          </p>
        </div>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  tutorEmail = '';
  role: 'student' | 'tutor' = 'student';
  loading = false;
  showPassword = false;
  errorMessage = '';
  emailError = false;
  passwordError = false;
  confirmError = false;
  tutorEmailError = false;

  async register(): Promise<void> {
    this.errorMessage = '';
    this.emailError = false;
    this.passwordError = false;
    this.confirmError = false;
    this.tutorEmailError = false;

    if (!this.isValidEmail(this.email)) { this.emailError = true; return; }
    if (this.password.length < 8) { this.passwordError = true; return; }
    if (this.password !== this.confirmPassword) { this.confirmError = true; return; }
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage = 'Veuillez renseigner votre prénom et nom.';
      return;
    }
    if (this.role === 'student' && !this.isValidEmail(this.tutorEmail)) {
      this.tutorEmailError = true;
      return;
    }

    this.loading = true;
    try {
      await this.authService.register(
        this.email, this.password,
        this.firstName.trim(), this.lastName.trim(),
        this.role,
        this.role === 'student' ? this.tutorEmail : undefined
      );
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      if (error.message === 'TUTOR_NOT_FOUND') {
        this.tutorEmailError = true;
        this.errorMessage = 'Aucun tuteur trouvé avec cet email.';
      } else {
        switch (error.code) {
          case 'auth/email-already-in-use':
            this.errorMessage = 'Cette adresse email est déjà utilisée.';
            break;
          case 'auth/weak-password':
            this.errorMessage = 'Mot de passe trop faible (minimum 6 caractères).';
            break;
          default:
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    } finally {
      this.loading = false;
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
