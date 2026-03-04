jest.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: jest.fn(() => ({})),
  collectionData: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  Timestamp: { fromDate: jest.fn(() => ({})) }
}));

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestoreModule from '@angular/fire/firestore';
import { TaskService } from './task.service';
import { Task } from '../models/models';

describe('TaskService', () => {
  let service: TaskService;

  const mockTask: Omit<Task, 'id'> = {
    title: 'Réviser les maths',
    description: 'Chapitres 3 et 4',
    dueDate: new Date('2025-06-01'),
    userId: 'uid-123',
    completed: false,
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (firestoreModule.collection as jest.Mock).mockReturnValue({});
    (firestoreModule.doc as jest.Mock).mockReturnValue({});
    (firestoreModule.query as jest.Mock).mockReturnValue({});
    (firestoreModule.where as jest.Mock).mockReturnValue({});
    (firestoreModule.addDoc as jest.Mock).mockResolvedValue({ id: 'task-id' });
    (firestoreModule.updateDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as jest.Mock).mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(TaskService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('addTask() appelle addDoc et Timestamp.fromDate', async () => {
    await service.addTask(mockTask);
    expect(firestoreModule.addDoc).toHaveBeenCalled();
    expect(firestoreModule.Timestamp.fromDate).toHaveBeenCalled();
  });

  it('updateTask() convertit dueDate en Timestamp si elle est fournie', async () => {
    await service.updateTask('task-id', { dueDate: new Date('2025-07-01') });
    expect(firestoreModule.updateDoc).toHaveBeenCalled();
    expect(firestoreModule.Timestamp.fromDate).toHaveBeenCalled();
  });

  it('toggleComplete() met à jour le champ completed', async () => {
    let capturedData: any;
    (firestoreModule.updateDoc as jest.Mock).mockImplementation((_ref: any, data: any) => {
      capturedData = data;
      return Promise.resolve();
    });

    await service.toggleComplete('task-id', true);
    expect(capturedData).toEqual({ completed: true });
  });
});
