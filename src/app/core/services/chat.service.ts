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
  orderBy,
  Timestamp,
  getDocs,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Conversation, Message } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);

  getUserConversations(userId: string): Observable<Conversation[]> {
    const q = query(
      collection(this.firestore, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((convs: any[]) => convs
        .map(c => ({
          ...c,
          lastMessageTime: c.lastMessageTime?.toDate ? c.lastMessageTime.toDate() : null,
          createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : new Date()
        }))
        .sort((a, b) => {
          const ta = a.lastMessageTime?.getTime() || 0;
          const tb = b.lastMessageTime?.getTime() || 0;
          return tb - ta;
        })
      )
    );
  }

  getMessages(conversationId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((msgs: any[]) => msgs.map(m => ({
        ...m,
        timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date()
      })))
    );
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<void> {
    await addDoc(
      collection(this.firestore, 'conversations', conversationId, 'messages'),
      { senderId, content, timestamp: Timestamp.fromDate(new Date()), read: false }
    );
    await updateDoc(doc(this.firestore, 'conversations', conversationId), {
      lastMessage: content,
      lastMessageTime: Timestamp.fromDate(new Date())
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'conversations', conversationId, 'messages'),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      const toMark = snap.docs.filter(d => d.data()['senderId'] !== userId);
      if (toMark.length === 0) return;
      const batch = writeBatch(this.firestore);
      toMark.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des messages comme lus :', error);
    }
  }

  async createConversation(participants: string[], participantDetails: any[]): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'conversations'), {
      participants,
      participantDetails,
      lastMessage: '',
      lastMessageTime: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date())
    });
    return ref.id;
  }

  async deleteConversation(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'conversations', id));
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const convSnap = await getDocs(query(
        collection(this.firestore, 'conversations'),
        where('participants', 'array-contains', userId)
      ));
      let total = 0;
      for (const convDoc of convSnap.docs) {
        const msgsSnap = await getDocs(query(
          collection(this.firestore, 'conversations', convDoc.id, 'messages'),
          where('read', '==', false)
        ));
        // Filtrage côté client : on ne compte que les messages envoyés par l'autre utilisateur
        total += msgsSnap.docs.filter(d => d.data()['senderId'] !== userId).length;
      }
      return total;
    } catch { return 0; }
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
