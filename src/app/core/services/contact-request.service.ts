import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import emailjs from '@emailjs/browser';
import { ContactRequest } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactRequestService {
  private firestore = inject(Firestore);

  async sendContactRequest(
    fromUid: string,
    fromDisplayName: string,
    toEmail: string
  ): Promise<void> {
    const data: Omit<ContactRequest, 'id'> = {
      fromUid,
      fromDisplayName,
      toEmail,
      status: 'pending',
      createdAt: new Date()
    };
    
    // L'ID du doc Firestore sert de token dans l'URL
    const ref = await addDoc(collection(this.firestore, 'contactRequests'), data);
    const token = ref.id;

    const validationLink = `${window.location.origin}/valider-contact?token=${token}`;
    try {
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.templateId,
        { from_name: fromDisplayName, to_email: toEmail, validation_link: validationLink },
        environment.emailjs.publicKey
      );
    } catch (e: any) {
      // Si l'envoi de l'email échoue, on supprime le doc Firestore pour éviter un enregistrement incomplet
      await deleteDoc(doc(this.firestore, 'contactRequests', token));
      const detail = e?.text || e?.message || JSON.stringify(e);
      throw new Error(`EmailJS error: ${detail}`);
    }
  }

  async getRequestByToken(token: string): Promise<ContactRequest | null> {
    const snap = await getDoc(doc(this.firestore, 'contactRequests', token));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      ...d,
      createdAt: d['createdAt']?.toDate?.() ?? new Date()
    } as ContactRequest;
  }

  async removeContact(fromUid: string, toUid: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', fromUid), { contactIds: arrayRemove(toUid) });
    await updateDoc(doc(this.firestore, 'users', toUid), { contactIds: arrayRemove(fromUid) });
  }

  async acceptRequest(token: string, toUid: string): Promise<void> {
    const request = await this.getRequestByToken(token);
    if (!request || request.status !== 'pending') throw new Error('REQUEST_INVALID');
    await updateDoc(doc(this.firestore, 'users', request.fromUid), {
      contactIds: arrayUnion(toUid)
    });
    await updateDoc(doc(this.firestore, 'users', toUid), {
      contactIds: arrayUnion(request.fromUid)
    });
    await updateDoc(doc(this.firestore, 'contactRequests', token), { status: 'accepted' });
  }
}
