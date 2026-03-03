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
import { Task, CalendarEvent } from '../../core/models/models';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasTasks: boolean;
  hasEvents: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, NavbarComponent, FooterComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private eventService = inject(EventService);

  tasks: Task[] = [];
  events: CalendarEvent[] = [];
  private subs = new Subscription();

  currentDate = new Date();
  selectedMonth = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  get weekItems(): (Task | CalendarEvent)[] {
    const start = this.getWeekStart(this.currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const items: (Task | CalendarEvent)[] = [
      ...this.tasks.filter(t => {
        const d = new Date(t.dueDate);
        return d >= start && d < end;
      }),
      ...this.events.filter(e => {
        const d = new Date(e.date);
        return d >= start && d < end;
      })
    ];
    return items.slice(0, 4);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.subs.add(this.taskService.getUserTasks(user.uid).subscribe(t => {
          this.tasks = t;
          this.buildCalendar();
        }));
        this.subs.add(this.eventService.getUserEvents(user.uid).subscribe(e => {
          this.events = e;
          this.buildCalendar();
        }));
      }
    });
    this.buildCalendar();
  }

  buildCalendar(): void {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    this.calendarDays = [];

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      this.calendarDays.push(this.createDay(date, false));
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      this.calendarDays.push(this.createDay(date, true));
    }

    // Next month days to fill the grid
    const remaining = 42 - this.calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push(this.createDay(date, false));
    }
  }

  createDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    const hasTasks = this.tasks.some(t => new Date(t.dueDate).toDateString() === date.toDateString());
    const hasEvents = this.events.some(e => new Date(e.date).toDateString() === date.toDateString());

    return { date, isCurrentMonth, isToday, hasTasks, hasEvents };
  }

  prevMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1);
    this.buildCalendar();
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  isTask(item: Task | CalendarEvent): item is Task {
    return 'dueDate' in item;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
