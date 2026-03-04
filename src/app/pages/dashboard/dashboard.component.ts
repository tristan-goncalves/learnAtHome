import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { EventService } from '../../core/services/event.service';
import { Task, CalendarEvent, User } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, NavbarComponent, FooterComponent],
  styleUrl: './dashboard.component.scss',
  template: `
    <div class="page-layout">
      <app-header></app-header>
      <div class="authenticated-layout">
        <app-navbar></app-navbar>
        <main class="page-content">
          <div class="dashboard">
            <div class="dashboard__welcome">
              <h1>Bonjour, {{ currentUser?.firstName }} 👋</h1>
              <p>Voici un aperçu de votre activité.</p>
            </div>

            <div class="dashboard__grid">
              <!-- Mes tâches -->
              <section class="dashboard-section">
                <div class="section-header">
                  <h2>
                    <span class="material-icons">check_circle</span>
                    Mes tâches
                  </h2>
                  <a routerLink="/taches" class="see-all">Voir tout →</a>
                </div>

                <div class="tasks-list" *ngIf="tasks.length > 0; else noTasks">
                  <div class="task-card card" *ngFor="let task of tasks.slice(0, 5)">
                    <div class="task-card__header">
                      <h3>{{ task.title }}</h3>
                      <span class="task-date">
                        <span class="material-icons">schedule</span>
                        {{ formatDate(task.dueDate) }}
                      </span>
                    </div>
                    <p class="task-description">{{ task.description }}</p>
                  </div>
                </div>

                <ng-template #noTasks>
                  <div class="empty-state">
                    <span>✅</span>
                    <p>Aucune tâche en cours. Bonne continuation !</p>
                  </div>
                </ng-template>
              </section>

              <!-- Événements à venir -->
              <section class="dashboard-section">
                <div class="section-header">
                  <h2>
                    <span class="material-icons">event</span>
                    Événements à venir
                  </h2>
                  <a routerLink="/taches" class="see-all">Voir tout →</a>
                </div>

                <div class="events-list" *ngIf="events.length > 0; else noEvents">
                  <div class="event-card card" *ngFor="let event of events.slice(0, 5)">
                    <div class="event-card__header">
                      <h3>{{ event.title }}</h3>
                      <span class="event-date">
                        <span class="material-icons">calendar_today</span>
                        {{ formatDate(event.date) }}
                      </span>
                    </div>
                    <p class="event-description">{{ event.description }}</p>
                    <div class="event-participants" *ngIf="event.participantPhotos?.length">
                      <ng-container *ngFor="let p of event.participantPhotos!.slice(0, 2)">
                        <img *ngIf="p.photoURL" [src]="p.photoURL" [alt]="p.displayName" class="avatar participant-avatar">
                        <div *ngIf="!p.photoURL" class="avatar participant-avatar avatar--initials">
                          {{ getParticipantInitials(p.displayName) }}
                        </div>
                      </ng-container>
                      <span *ngIf="event.participantPhotos!.length > 2" class="more-participants">
                        +{{ event.participantPhotos!.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>

                <ng-template #noEvents>
                  <div class="empty-state">
                    <span>📅</span>
                    <p>Aucun événement à venir.</p>
                  </div>
                </ng-template>
              </section>
            </div>
          </div>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private eventService = inject(EventService);

  currentUser: User | null = null;
  tasks: Task[] = [];
  events: CalendarEvent[] = [];
  private subs = new Subscription();

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadData(user.uid);
      }
    });
  }

  loadData(userId: string): void {
    this.subs.add(
      this.taskService.getUserTasks(userId).subscribe(tasks => {
        this.tasks = tasks.filter(t => !t.completed);
      })
    );
    this.subs.add(
      this.eventService.getUserEvents(userId).subscribe(events => {
        const now = new Date();
        this.events = events.filter(e => e.date >= now);
      })
    );
  }

  getParticipantInitials(displayName: string): string {
    const parts = displayName.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
