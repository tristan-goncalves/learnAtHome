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
  orderBy: jest.fn(() => ({})),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  Timestamp: { fromDate: jest.fn(() => ({})) }
}));

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestoreModule from '@angular/fire/firestore';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    (firestoreModule.collection as jest.Mock).mockReturnValue({});
    (firestoreModule.doc as jest.Mock).mockReturnValue({});
    (firestoreModule.query as jest.Mock).mockReturnValue({});
    (firestoreModule.where as jest.Mock).mockReturnValue({});
    (firestoreModule.orderBy as jest.Mock).mockReturnValue({});
    (firestoreModule.addDoc as jest.Mock).mockResolvedValue({ id: 'test-id' });
    (firestoreModule.updateDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    (firestoreModule.writeBatch as jest.Mock).mockReturnValue({
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    });

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(ChatService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('sendMessage() ajoute le message et met à jour la conversation', async () => {
    await service.sendMessage('conv-id', 'user-id', 'Bonjour !');
    expect(firestoreModule.addDoc).toHaveBeenCalled();
    expect(firestoreModule.updateDoc).toHaveBeenCalled();
  });

  it('createConversation() crée une conversation et retourne son id', async () => {
    (firestoreModule.addDoc as jest.Mock).mockResolvedValue({ id: 'conv-new-id' });
    const id = await service.createConversation(
      ['uid1', 'uid2'],
      [{ uid: 'uid1', displayName: 'Alice', photoURL: null }, { uid: 'uid2', displayName: 'Bob', photoURL: null }]
    );
    expect(id).toBe('conv-new-id');
  });

  it('markMessagesAsRead() commit le batch quand il y a des messages non lus', async () => {
    const batchMock = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
    (firestoreModule.writeBatch as jest.Mock).mockReturnValue(batchMock);
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ senderId: 'other-user' }), ref: {} }]
    });

    await service.markMessagesAsRead('conv-id', 'current-user');
    expect(batchMock.commit).toHaveBeenCalled();
  });
});
