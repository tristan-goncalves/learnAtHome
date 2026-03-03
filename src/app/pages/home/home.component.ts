import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  styleUrl: './home.component.scss',
  template: `
    <div class="page-layout">
      <app-header></app-header>

      <main class="home">
        <div class="home__hero">
          <div class="home__content">
            <h1 class="home__title">
              Vos études,<br>
              <span class="highlight">notre réussite.</span>
            </h1>
            <p class="home__subtitle">
              LearnAtHome connecte les élèves en difficulté scolaire
              avec des bénévoles passionnés, partout en France.
            </p>
            <div class="home__actions">
              <a routerLink="/connexion" class="btn btn-primary">Se connecter</a>
              <a routerLink="/inscription" class="btn btn-secondary">S'inscrire gratuitement</a>
            </div>
          </div>
          <div class="home__image">
            <div class="image-placeholder">
              <span class="emoji">👨‍🎓</span>
              <p>Un accompagnement personnalisé</p>
            </div>
          </div>
        </div>

        <!-- Features -->
        <section class="features">
          <div class="features__grid">
            <div class="feature-card">
              <span class="feature-icon">📅</span>
              <h3>Rendez-vous hebdomadaires</h3>
              <p>Des sessions régulières planifiées avec votre tuteur attitré.</p>
            </div>
            <div class="feature-card">
              <span class="feature-icon">💬</span>
              <h3>Messagerie intégrée</h3>
              <p>Communiquez facilement avec votre tuteur à tout moment.</p>
            </div>
            <div class="feature-card">
              <span class="feature-icon">✅</span>
              <h3>Suivi des tâches</h3>
              <p>Gérez vos devoirs et suivez votre progression.</p>
            </div>
          </div>
        </section>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class HomeComponent {}
