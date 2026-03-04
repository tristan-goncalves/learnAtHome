import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TasksComponent } from './tasks.component';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { User } from '../../core/models/models';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  const mockUser: User = {
    uid: 'uid-tutor',
    email: 'prof@test.com',
    firstName: 'Professeur',
    lastName: 'Tortue',
    role: 'tutor',
    createdAt: new Date()
  };

  beforeEach(async () => {
    const authSpy = {
      currentUser$: of(mockUser),
      getUserData: jest.fn().mockResolvedValue(null)
    };
    const taskSpy = {
      getUserTasks: jest.fn().mockReturnValue(of([])),
      addTask: jest.fn().mockResolvedValue(undefined),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      toggleComplete: jest.fn()
    };
    const eventSpy = {
      getUserEvents: jest.fn().mockReturnValue(of([])),
      addEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: TaskService, useValue: taskSpy },
        { provide: EventService, useValue: eventSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(TasksComponent, {
        remove: { imports: [HeaderComponent, NavbarComponent, FooterComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('addParticipant() ajoute un utilisateur valide et réinitialise la sélection', () => {
    component.relatedUsers = [{ uid: 'uid-student', displayName: 'Jean Élève' }];
    component.eventParticipants = [];
    component.selectedParticipantId = 'uid-student';

    component.addParticipant();

    expect(component.eventParticipants.length).toBe(1);
    expect(component.eventParticipants[0].uid).toBe('uid-student');
    expect(component.selectedParticipantId).toBe('');
  });

  it('saveTask() définit taskError si le titre est manquant', async () => {
    component.currentUser = mockUser;
    component.taskForm = { title: '', description: '', dueDate: '2025-06-01T10:00' };

    await component.saveTask();

    expect(component.taskError).toContain('titre');
  });

  it("updateRelatedUsers() inclut les contacts d'invitation sans doublons", () => {
    component.currentUser = mockUser;
    component['invitationContacts'] = [{ uid: 'uid-contact', displayName: 'Contact Invité' }];

    (component as any).updateRelatedUsers();

    expect(component.relatedUsers.some(u => u.uid === 'uid-contact')).toBe(true);
  });
});
