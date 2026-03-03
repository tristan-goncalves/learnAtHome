import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  loading = false;
  emailError = false;
  successMessage = '';
  errorMessage = '';

  async sendReset(): Promise<void> {
    this.emailError = false;
    this.errorMessage = '';

    if (!this.isValidEmail(this.email)) {
      this.emailError = true;
      return;
    }

    this.loading = true;
    try {
      await this.authService.sendPasswordReset(this.email);
      this.successMessage = `Un email de réinitialisation a été envoyé à ${this.email}.`;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        this.successMessage = `Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.`;
      } else {
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
