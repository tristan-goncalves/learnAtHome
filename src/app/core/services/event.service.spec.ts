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
  getDocs: jest.fn(),
  Timestamp: { fromDate: jest.fn(() => ({})) }
}));

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestoreModule from '@angular/fire/firestore';
import { EventService } from './event.service';
import { CalendarEvent } from '../models/models';

describe('EventService', () => {
  let service: EventService;

  const mockEvent: Omit<CalendarEvent, 'id'> = {
    title: 'Session de tutorat',
    description: 'Mathématiques',
    date: new Date('2025-06-15T14:00:00'),
    creatorId: 'uid-123',
    participants: ['uid-123', 'uid-456'],
    participantPhotos: [],
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (firestoreModule.collection as jest.Mock).mockReturnValue({});
    (firestoreModule.doc as jest.Mock).mockReturnValue({});
    (firestoreModule.query as jest.Mock).mockReturnValue({});
    (firestoreModule.where as jest.Mock).mockReturnValue({});
    (firestoreModule.addDoc as jest.Mock).mockResolvedValue({ id: 'event-id' });
    (firestoreModule.updateDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

    TestBed.configureTestingModule({
      providers: [
        EventService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(EventService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it("addEvent() appelle addDoc et Timestamp.fromDate", async () => {
    await service.addEvent(mockEvent);
    expect(firestoreModule.addDoc).toHaveBeenCalled();
    expect(firestoreModule.Timestamp.fromDate).toHaveBeenCalled();
  });

  it("updateEvent() convertit la date en Timestamp si elle est fournie", async () => {
    await service.updateEvent('event-id', { date: new Date('2025-07-01') });
    expect(firestoreModule.updateDoc).toHaveBeenCalled();
    expect(firestoreModule.Timestamp.fromDate).toHaveBeenCalled();
  });

  it("findUserByEmail() retourne un profil quand l'email est trouvé", async () => {
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [{ id: 'uid-456', data: () => ({ firstName: 'Bob', lastName: 'Martin', photoURL: null }) }]
    });

    const result = await service.findUserByEmail('bob@test.com');
    expect(result).not.toBeNull();
    expect(result!.uid).toBe('uid-456');
    expect(result!.displayName).toBe('Bob Martin');
  });
});
