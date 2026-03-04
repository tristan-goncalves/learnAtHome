import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  arrayUnion
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/models';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser.uid);
        if (user) {
          this.currentUserSubject.next(user);
        } else {
          // Fallback : si document Firestore absent -> on le crée à partir des données Firebase Auth
          const nameParts = firebaseUser.displayName?.split(' ') ?? [];
          const fallbackUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            firstName: nameParts[0] ?? '',
            lastName: nameParts.slice(1).join(' ') ?? '',
            role: 'student',
            photoURL: firebaseUser.photoURL ?? undefined,
            createdAt: new Date()
          };
          try {
            await setDoc(doc(this.firestore, 'users', firebaseUser.uid), {
              uid: fallbackUser.uid,
              email: fallbackUser.email,
              firstName: fallbackUser.firstName,
              lastName: fallbackUser.lastName,
              role: fallbackUser.role,
              photoURL: fallbackUser.photoURL ?? null,
              createdAt: fallbackUser.createdAt
            });
          } catch (error) {
            console.error('Erreur lors de la création du document utilisateur Firestore :', error);
          }
          this.currentUserSubject.next(fallbackUser);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'student' | 'tutor',
    tutorEmail?: string
  ): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
    try {
      await setDoc(doc(this.firestore, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        firstName,
        lastName,
        role,
        photoURL: null,
        createdAt: new Date()
      });

      if (role === 'student' && tutorEmail) {
        const tutor = await this.findUserByEmail(tutorEmail);
        if (!tutor || tutor.role !== 'tutor') {
          throw new Error('TUTOR_NOT_FOUND');
        }
        await updateDoc(doc(this.firestore, 'users', tutor.uid), {
          studentIds: arrayUnion(cred.user.uid)
        });
        await setDoc(doc(this.firestore, 'users', cred.user.uid), { tutorId: tutor.uid }, { merge: true });
      }

      const userData = await this.getUserData(cred.user.uid);
      if (userData) this.currentUserSubject.next(userData);
    } catch (error) {
      // Firestore indisponible : alors le document sera créé au prochain login via onAuthStateChanged
      console.error('Erreur lors de la création du document utilisateur Firestore :', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/connexion']);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          ...data,
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date()
        } as User;
      }
      return null;
    } catch {
      return null;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(this.firestore, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return {
          uid: d.id,
          ...data,
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date()
        } as User;
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateUserProfile(uid: string, data: { firstName?: string; lastName?: string; photoURL?: string }): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) updateData['firstName'] = data.firstName;
    if (data.lastName !== undefined) updateData['lastName'] = data.lastName;
    if (data.photoURL !== undefined) updateData['photoURL'] = data.photoURL;

    await setDoc(doc(this.firestore, 'users', uid), updateData, { merge: true });
    const current = this.currentUserSubject.value;
    if (current) this.currentUserSubject.next({ ...current, ...data });
    if (this.auth.currentUser) {
      const fn = data.firstName ?? current?.firstName ?? '';
      const ln = data.lastName ?? current?.lastName ?? '';
      await updateProfile(this.auth.currentUser, { displayName: `${fn} ${ln}`.trim() });
    }
  }

  // Stocke la photo en base64 dans Firestore (comme on peut pas utiliser de Storage vu que c'est payant)
  async uploadProfilePhotoAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async refreshCurrentUser(): Promise<void> {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const fresh = await this.getUserData(current.uid);
    if (fresh) this.currentUserSubject.next(fresh);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}
