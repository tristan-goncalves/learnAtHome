import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  getDocs
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalendarEvent } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private firestore = inject(Firestore);

  getUserEvents(userId: string): Observable<CalendarEvent[]> {
    const q = query(
      collection(this.firestore, 'events'),
      where('participants', 'array-contains', userId)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((events: any[]) => events
        .map(e => ({
          ...e,
          date: e.date?.toDate ? e.date.toDate() : new Date(e.date),
          createdAt: e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      )
    );
  }

  async addEvent(event: Omit<CalendarEvent, 'id'>): Promise<void> {
    await addDoc(collection(this.firestore, 'events'), {
      ...event,
      date: Timestamp.fromDate(new Date(event.date)),
      createdAt: Timestamp.fromDate(new Date())
    });
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    const data: any = { ...event };
    if (event.date) data.date = Timestamp.fromDate(new Date(event.date));
    await updateDoc(doc(this.firestore, 'events', id), data);
  }

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'events', id));
  }

  async findUserByEmail(email: string): Promise<{ uid: string; displayName: string; photoURL?: string } | null> {
    const q = query(collection(this.firestore, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data();
      return {
        uid: d.id,
        displayName: `${data['firstName']} ${data['lastName']}`,
        photoURL: data['photoURL']
      };
    }
    return null;
  }
}
