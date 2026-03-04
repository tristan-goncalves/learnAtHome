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
interface EventForm { title: string; description: string; date: string; }

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
  students: User[] = [];
  tutor: User | null = null;
  private subs = new Subscription();

  toast: { msg: string; type: 'success' | 'error' } | null = null;

  // Modal de Tâche
  showTaskModal = false;
  showDeleteTaskModal = false;
  editingTask: Task | null = null;
  deletingTaskId = '';
  taskForm: TaskForm = { title: '', description: '', dueDate: '' };
  taskForStudentId = '';
  taskLoading = false;
  taskError = '';

  // Modal d'Événement
  showEventModal = false;
  showDeleteEventModal = false;
  editingEvent: CalendarEvent | null = null;
  deletingEventId = '';
  eventForm: EventForm = { title: '', description: '', date: '' };
  selectedParticipantId = '';
  eventLoading = false;
  eventError = '';
  eventParticipants: { uid: string; displayName: string; photoURL?: string }[] = [];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) this.loadData(user);
    });
  }

  loadData(user: User): void {
    this.subs.add(
      this.taskService.getUserTasks(user.uid).subscribe({
        next: (t) => this.tasks = t,
        error: (e) => this.showToast('Erreur chargement tâches : ' + (e?.message || e), 'error')
      })
    );
    this.subs.add(
      this.eventService.getUserEvents(user.uid).subscribe({
        next: (e) => this.events = e,
        error: (e) => this.showToast('Erreur chargement événements : ' + (e?.message || e), 'error')
      })
    );
    if (user.role === 'tutor' && user.studentIds?.length) {
      Promise.all(user.studentIds.map(uid => this.authService.getUserData(uid)))
        .then(profiles => {
          this.students = profiles.filter(Boolean) as User[];
          this.updateRelatedUsers();
        });
    }
    if (user.role === 'student' && user.tutorId) {
      this.authService.getUserData(user.tutorId).then(t => {
        this.tutor = t;
        this.updateRelatedUsers();
      });
    }
    this.authService.getUserData(user.uid).then(freshUser => {
      if (freshUser?.contactIds?.length) {
        Promise.all(freshUser.contactIds.map(uid => this.authService.getUserData(uid)))
          .then(profiles => {
            this.invitationContacts = profiles.filter(Boolean).map(u => ({
              uid: u!.uid,
              displayName: `${u!.firstName} ${u!.lastName}`,
              photoURL: u!.photoURL
            }));
            this.updateRelatedUsers();
          });
      }
    });
  }

  relatedUsers: { uid: string; displayName: string; photoURL?: string }[] = [];
  private invitationContacts: { uid: string; displayName: string; photoURL?: string }[] = [];

  private updateRelatedUsers(): void {
    const base: { uid: string; displayName: string; photoURL?: string }[] = [];
    if (this.currentUser?.role === 'tutor') {
      base.push(...this.students.map(s => ({
        uid: s.uid,
        displayName: `${s.firstName} ${s.lastName}`,
        photoURL: s.photoURL
      })));
    } else if (this.currentUser?.role === 'student' && this.tutor) {
      base.push({ uid: this.tutor.uid, displayName: `${this.tutor.firstName} ${this.tutor.lastName}`, photoURL: this.tutor.photoURL });
    }
    this.invitationContacts.forEach(c => {
      if (!base.find(u => u.uid === c.uid)) base.push(c);
    });
    this.relatedUsers = base;
  }

  // TÂCHES
  openAddTask(): void {
    this.editingTask = null;
    this.taskError = '';
    this.taskForm = { title: '', description: '', dueDate: '' };
    this.taskForStudentId = '';
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
      const targetUserId = this.currentUser.role === 'tutor' && this.taskForStudentId
        ? this.taskForStudentId
        : this.currentUser.uid;
      const data: Omit<Task, 'id'> = {
        title: this.taskForm.title.trim(),
        description: this.taskForm.description.trim(),
        dueDate: new Date(this.taskForm.dueDate),
        userId: targetUserId,
        completed: false,
        createdAt: new Date(),
        ...(targetUserId !== this.currentUser.uid ? { createdBy: this.currentUser.uid } : {})
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
    this.eventForm = { title: '', description: '', date: '' };
    this.eventParticipants = [];
    this.selectedParticipantId = '';
    this.showEventModal = true;
  }

  openEditEvent(event: CalendarEvent): void {
    this.editingEvent = event;
    this.eventError = '';
    this.eventForm = {
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16)
    };
    this.eventParticipants = (event.participantPhotos || []).filter(p => p.uid !== event.creatorId);
    this.selectedParticipantId = '';
    this.showEventModal = true;
  }

  addParticipant(): void {
    if (!this.selectedParticipantId) return;
    const user = this.relatedUsers.find(u => u.uid === this.selectedParticipantId);
    if (user && !this.eventParticipants.find(p => p.uid === user.uid)) {
      this.eventParticipants.push(user);
    }
    this.selectedParticipantId = '';
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
      const creatorEntry = {
        uid: this.currentUser.uid,
        displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        photoURL: this.currentUser.photoURL
      };
      const otherParticipants = this.eventParticipants.filter(p => p.uid !== this.currentUser!.uid);
      const allParticipants = [this.currentUser.uid, ...otherParticipants.map(p => p.uid)];
      const data: Omit<CalendarEvent, 'id'> = {
        title: this.eventForm.title.trim(),
        description: this.eventForm.description.trim(),
        date: new Date(this.eventForm.date),
        creatorId: this.currentUser.uid,
        participants: [...new Set(allParticipants)],
        participantPhotos: [creatorEntry, ...otherParticipants],
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

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 3500);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
