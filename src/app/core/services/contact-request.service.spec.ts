jest.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  arrayUnion: jest.fn(() => []),
  arrayRemove: jest.fn(() => [])
}));

jest.mock('@emailjs/browser', () => ({
  __esModule: true,
  default: { send: jest.fn() }
}));

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestoreModule from '@angular/fire/firestore';
import emailjs from '@emailjs/browser';
import { ContactRequestService } from './contact-request.service';

describe('ContactRequestService', () => {
  let service: ContactRequestService;

  const mockRequest = {
    id: 'token-abc',
    fromUid: 'uid-sender',
    fromDisplayName: 'Alice Martin',
    toEmail: 'bob@test.com',
    status: 'pending' as const,
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (firestoreModule.collection as jest.Mock).mockReturnValue({});
    (firestoreModule.doc as jest.Mock).mockReturnValue({});
    (firestoreModule.addDoc as jest.Mock).mockResolvedValue({ id: 'token-abc' });
    (firestoreModule.updateDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    (firestoreModule.arrayUnion as jest.Mock).mockReturnValue([]);
    (firestoreModule.arrayRemove as jest.Mock).mockReturnValue([]);

    TestBed.configureTestingModule({
      providers: [
        ContactRequestService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(ContactRequestService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it("sendContactRequest() crée un document Firestore et envoie l'email", async () => {
    (emailjs.send as jest.Mock).mockResolvedValue({ status: 200, text: 'OK' });

    await service.sendContactRequest('uid-sender', 'Alice Martin', 'bob@test.com');
    expect(firestoreModule.addDoc).toHaveBeenCalled();
    expect(emailjs.send).toHaveBeenCalled();
  });

  it('acceptRequest() lève REQUEST_INVALID si la demande est déjà acceptée', async () => {
    jest.spyOn(service, 'getRequestByToken').mockResolvedValue({ ...mockRequest, status: 'accepted' });

    await expect(service.acceptRequest('token-abc', 'uid-bob')).rejects.toThrow('REQUEST_INVALID');
  });
});
