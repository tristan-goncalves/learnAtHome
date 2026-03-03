import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  styleUrl: './contact.component.scss',
  template: `
    <div class="page-layout">
      <app-header></app-header>

      <main class="contact-page">
        <div class="contact-hero">
          <h1>Nous contacter</h1>
          <p>Notre équipe est disponible pour répondre à toutes vos questions.</p>
        </div>

        <div class="contact-container">

          <div class="info-grid">
            <div class="info-card card">
              <div class="info-icon">📧</div>
              <h3>Email</h3>
              <p>contact&#64;learnathome.fr</p>
              <a href="mailto:contact@learnathome.fr" class="btn btn-primary">Envoyer un email</a>
            </div>

            <div class="info-card card">
              <div class="info-icon">📞</div>
              <h3>Téléphone</h3>
              <p>+33 (0)1 23 45 67 89</p>
              <p class="hours">Lun – Ven &nbsp;|&nbsp; 9h – 18h</p>
            </div>

            <div class="info-card card">
              <div class="info-icon">📍</div>
              <h3>Adresse</h3>
              <p>12 Rue de l'Éducation<br>75001 Paris, France</p>
            </div>

            <div class="info-card card">
              <div class="info-icon">💬</div>
              <h3>Réseaux sociaux</h3>
              <div class="social-links">
                <a href="#" class="social-btn">𝕏 Twitter</a>
                <a href="#" class="social-btn">in LinkedIn</a>
                <a href="#" class="social-btn">f Facebook</a>
              </div>
            </div>
          </div>

          <div class="faq-section card">
            <h2>Questions fréquentes</h2>
            <div class="faq-list">
              <div class="faq-item" *ngFor="let faq of faqs" (click)="faq.open = !faq.open">
                <div class="faq-question">
                  <span>{{ faq.q }}</span>
                  <span class="material-icons">{{ faq.open ? 'expand_less' : 'expand_more' }}</span>
                </div>
                <p class="faq-answer" *ngIf="faq.open">{{ faq.a }}</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class ContactComponent {
  faqs = [
    {
      q: 'Comment m\'inscrire sur LearnAtHome ?',
      a: 'Cliquez sur "Inscription" en haut de la page. L\'inscription est gratuite et ouverte à tous.',
      open: false
    },
    {
      q: 'L\'application est-elle gratuite ?',
      a: 'Oui, LearnAtHome est entièrement gratuit, pour les élèves comme pour les tuteurs bénévoles.',
      open: false
    },
    {
      q: 'Comment fonctionne l\'assignation tuteur/élève ?',
      a: 'Notre équipe s\'occupe de vous mettre en relation avec un partenaire compatible selon vos disponibilités et matières.',
      open: false
    },
    {
      q: 'Puis-je changer de tuteur ?',
      a: 'Oui, écrivez-nous à contact@learnathome.fr et nous ferons notre possible pour trouver un tuteur mieux adapté.',
      open: false
    },
    {
      q: 'Les échanges sont-ils privés ?',
      a: 'Oui. Les messages entre élèves et tuteurs sont privés. Seuls les participants à une conversation peuvent la lire.',
      open: false
    }
  ];
}
