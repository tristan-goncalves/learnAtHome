import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { EventService } from '../../core/services/event.service';
import { Task, CalendarEvent, User } from '../../core/models/models';

interface TaskForm { title: string; description: string; dueDate: string; }
interface EventForm { title: string; description: string; date: string; participantEmail: string; }

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, NavbarComponent, FooterComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private eventService = inject(EventService);

  currentUser: User | null = null;
  tasks: Task[] = [];
  events: CalendarEvent[] = [];
  private subs = new Subscription();

  toast: { msg: string; type: 'success' | 'error' } | null = null;

  // Modal de Tâche
  showTaskModal = false;
  showDeleteTaskModal = false;
  editingTask: Task | null = null;
  deletingTaskId = '';
  taskForm: TaskForm = { title: '', description: '', dueDate: '' };
  taskLoading = false;
  taskError = '';

  // Modal d'Événement
  showEventModal = false;
  showDeleteEventModal = false;
  editingEvent: CalendarEvent | null = null;
  deletingEventId = '';
  eventForm: EventForm = { title: '', description: '', date: '', participantEmail: '' };
  eventLoading = false;
  eventError = '';
  participantError = '';
  eventParticipants: { uid: string; displayName: string; photoURL?: string }[] = [];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) this.loadData(user.uid);
    });
  }

  loadData(userId: string): void {
    this.subs.add(
      this.taskService.getUserTasks(userId).subscribe({
        next: (t) => this.tasks = t,
        error: (e) => this.showToast('Erreur chargement tâches : ' + (e?.message || e), 'error')
      })
    );
    this.subs.add(
      this.eventService.getUserEvents(userId).subscribe({
        next: (e) => this.events = e,
        error: (e) => this.showToast('Erreur chargement événements : ' + (e?.message || e), 'error')
      })
    );
  }

  // TÂCHES
  openAddTask(): void {
    this.editingTask = null;
    this.taskError = '';
    this.taskForm = { title: '', description: '', dueDate: '' };
    this.showTaskModal = true;
  }

  openEditTask(task: Task): void {
    this.editingTask = task;
    this.taskError = '';
    this.taskForm = {
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().slice(0, 16)
    };
    this.showTaskModal = true;
  }

  async saveTask(): Promise<void> {
    if (!this.taskForm.title || !this.taskForm.dueDate) {
      this.taskError = 'Veuillez remplir le titre et la date.';
      return;
    }
    if (!this.currentUser) {
      this.taskError = 'Utilisateur non connecté. Rechargez la page.';
      return;
    }
    this.taskLoading = true;
    this.taskError = '';
    try {
      const data: Omit<Task, 'id'> = {
        title: this.taskForm.title.trim(),
        description: this.taskForm.description.trim(),
        dueDate: new Date(this.taskForm.dueDate),
        userId: this.currentUser.uid,
        completed: false,
        createdAt: new Date()
      };
      if (this.editingTask?.id) {
        await this.taskService.updateTask(this.editingTask.id, data);
        this.showToast('Tâche modifiée ✓', 'success');
      } else {
        await this.taskService.addTask(data);
        this.showToast('Tâche créée ✓', 'success');
      }
      this.showTaskModal = false;
    } catch (err: any) {
      console.error('Erreur saveTask:', err);
      this.taskError = err?.message?.includes('Missing or insufficient permissions')
        ? 'Permissions Firestore insuffisantes. Vérifiez les règles Firestore dans la console Firebase.'
        : `Erreur : ${err?.message || 'Inconnue'}`;
    } finally {
      this.taskLoading = false;
    }
  }

  confirmDeleteTask(id: string): void {
    this.deletingTaskId = id;
    this.showDeleteTaskModal = true;
  }

  async deleteTask(): Promise<void> {
    try {
      await this.taskService.deleteTask(this.deletingTaskId);
      this.showToast('Tâche supprimée', 'success');
    } catch {
      this.showToast('Erreur lors de la suppression', 'error');
    } finally {
      this.showDeleteTaskModal = false;
    }
  }

  async toggleTask(task: Task): Promise<void> {
    if (task.id) {
      try {
        await this.taskService.toggleComplete(task.id, !task.completed);
      } catch {
        this.showToast('Erreur lors de la mise à jour', 'error');
      }
    }
  }

  // ÉVÉNEMENTS
  openAddEvent(): void {
    this.editingEvent = null;
    this.eventError = '';
    this.eventForm = { title: '', description: '', date: '', participantEmail: '' };
    this.eventParticipants = [];
    this.participantError = '';
    this.showEventModal = true;
  }

  openEditEvent(event: CalendarEvent): void {
    this.editingEvent = event;
    this.eventError = '';
    this.eventForm = {
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      participantEmail: ''
    };
    this.eventParticipants = event.participantPhotos || [];
    this.participantError = '';
    this.showEventModal = true;
  }

  async addParticipant(): Promise<void> {
    this.participantError = '';
    if (!this.eventForm.participantEmail) return;
    try {
      const user = await this.eventService.findUserByEmail(this.eventForm.participantEmail);
      if (user) {
        if (!this.eventParticipants.find(p => p.uid === user.uid)) {
          this.eventParticipants.push(user);
        }
        this.eventForm.participantEmail = '';
      } else {
        this.participantError = 'Aucun utilisateur trouvé avec cet email.';
      }
    } catch {
      this.participantError = 'Erreur lors de la recherche.';
    }
  }

  removeParticipant(uid: string): void {
    this.eventParticipants = this.eventParticipants.filter(p => p.uid !== uid);
  }

  async saveEvent(): Promise<void> {
    if (!this.eventForm.title || !this.eventForm.date) {
      this.eventError = 'Veuillez remplir le titre et la date.';
      return;
    }
    if (!this.currentUser) {
      this.eventError = 'Utilisateur non connecté. Rechargez la page.';
      return;
    }
    this.eventLoading = true;
    this.eventError = '';
    try {
      const allParticipants = [this.currentUser.uid, ...this.eventParticipants.map(p => p.uid)];
      const data: Omit<CalendarEvent, 'id'> = {
        title: this.eventForm.title.trim(),
        description: this.eventForm.description.trim(),
        date: new Date(this.eventForm.date),
        creatorId: this.currentUser.uid,
        participants: [...new Set(allParticipants)],
        participantPhotos: this.eventParticipants,
        createdAt: new Date()
      };
      if (this.editingEvent?.id) {
        await this.eventService.updateEvent(this.editingEvent.id, data);
        this.showToast('Événement modifié ✓', 'success');
      } else {
        await this.eventService.addEvent(data);
        this.showToast('Événement créé ✓', 'success');
      }
      this.showEventModal = false;
    } catch (err: any) {
      console.error('Erreur saveEvent:', err);
      this.eventError = err?.message?.includes('Missing or insufficient permissions')
        ? 'Permissions Firestore insuffisantes. Vérifiez les règles Firestore dans la console Firebase.'
        : `Erreur : ${err?.message || 'Inconnue'}`;
    } finally {
      this.eventLoading = false;
    }
  }

  confirmDeleteEvent(id: string): void {
    this.deletingEventId = id;
    this.showDeleteEventModal = true;
  }

  async deleteEvent(): Promise<void> {
    try {
      await this.eventService.deleteEvent(this.deletingEventId);
      this.showToast('Événement supprimé', 'success');
    } catch {
      this.showToast('Erreur lors de la suppression', 'error');
    } finally {
      this.showDeleteEventModal = false;
    }
  }

  canDeleteEvent(event: CalendarEvent): boolean {
    return event.creatorId === this.currentUser?.uid;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 3500);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
