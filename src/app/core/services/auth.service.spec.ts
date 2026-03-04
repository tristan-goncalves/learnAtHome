import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

jest.mock('@angular/fire/auth', () => ({
  Auth: class {},
  onAuthStateChanged: jest.fn(() => () => {}),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  arrayUnion: jest.fn(() => [])
}));

import * as authModule from '@angular/fire/auth';
import * as firestoreModule from '@angular/fire/firestore';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: { navigate: jest.Mock };

  const mockUserData = {
    uid: 'uid-123', email: 'test@test.com', firstName: 'Jean', lastName: 'Dupont',
    role: 'tutor', createdAt: { toDate: () => new Date() }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    routerSpy = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Firestore, useValue: {} },
        { provide: Auth, useValue: { currentUser: null } },
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('login() appelle signInWithEmailAndPassword avec les bons arguments', async () => {
    (authModule.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    await service.login('test@test.com', 'password123');
    expect(authModule.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object), 'test@test.com', 'password123'
    );
  });

  it('logout() appelle signOut et navigue vers /connexion', async () => {
    (authModule.signOut as jest.Mock).mockResolvedValue(undefined);
    await service.logout();
    expect(authModule.signOut).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/connexion']);
  });

  it('register() crée un tuteur avec createUserWithEmailAndPassword + setDoc', async () => {
    (authModule.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: 'uid-new' } });
    (authModule.updateProfile as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.setDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    (firestoreModule.getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockUserData });

    await service.register('test@test.com', 'password', 'Jean', 'Dupont', 'tutor');

    expect(authModule.createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(firestoreModule.setDoc).toHaveBeenCalled();
  });

  it('register() lève TUTOR_NOT_FOUND si le tuteur est introuvable', async () => {
    (authModule.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: 'student-uid' } });
    (authModule.updateProfile as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.setDoc as jest.Mock).mockResolvedValue(undefined);
    (firestoreModule.getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

    await expect(
      service.register('j@test.com', 'pass', 'Jean', 'D', 'student', 'inconnu@test.com')
    ).rejects.toThrow('TUTOR_NOT_FOUND');
  });
});
