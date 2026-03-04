import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ContactRequestService } from '../../core/services/contact-request.service';

@Component({
  selector: 'app-contact-validation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="validation-page">
      <div class="validation-card" *ngIf="state === 'loading'">
        <div class="spinner-large"></div>
        <p>Validation en cours...</p>
      </div>
      <div class="validation-card success" *ngIf="state === 'success'">
        <span class="material-icons">check_circle</span>
        <h2>Contact ajouté !</h2>
        <p>Vous pouvez maintenant démarrer une conversation.</p>
        <a routerLink="/messagerie" class="btn btn-primary">Aller à la messagerie</a>
      </div>
      <div class="validation-card error" *ngIf="state === 'error'">
        <span class="material-icons">error</span>
        <h2>Lien invalide ou expiré</h2>
        <p>{{ errorMsg }}</p>
        <a routerLink="/dashboard" class="btn btn-ghost">Retour au tableau de bord</a>
      </div>
    </div>
  `,
  styles: [`
    .validation-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary, #f5f5f5);
      font-family: inherit;
    }
    .validation-card {
      background: white;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,.1);
      max-width: 420px;
      width: 90%;
    }
    .material-icons { font-size: 3rem; }
    .success .material-icons { color: #22c55e; }
    .error .material-icons { color: #ef4444; }
    h2 { margin: 1rem 0 .5rem; font-size: 1.4rem; }
    p { color: #666; margin: 0 0 .5rem; }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn {
      display: inline-block;
      margin-top: 1.5rem;
      padding: .75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--primary, #6366f1);
      color: white;
    }
    .btn-ghost {
      border: 1px solid #ccc;
      color: #555;
    }
  `]
})
export class ContactValidationComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private contactRequestService = inject(ContactRequestService);

  state: 'loading' | 'success' | 'error' = 'loading';
  errorMsg = '';
  private sub?: Subscription;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error';
      this.errorMsg = 'Aucun token fourni.';
      return;
    }

    this.sub = authState(this.auth).pipe(take(1)).subscribe(async (firebaseUser) => {
      if (!firebaseUser) {
        this.router.navigate(['/connexion'], {
          queryParams: { returnUrl: `/valider-contact?token=${token}` }
        });
        return;
      }
      try {
        await this.contactRequestService.acceptRequest(token, firebaseUser.uid);
        await this.authService.refreshCurrentUser();
        this.state = 'success';
      } catch (e: any) {
        this.state = 'error';
        this.errorMsg = e?.message === 'REQUEST_INVALID'
          ? 'Ce lien a déjà été utilisé ou est invalide.'
          : 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
