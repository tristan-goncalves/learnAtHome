import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ContactRequestService } from '../../core/services/contact-request.service';
import { Conversation, Message, User } from '../../core/models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, NavbarComponent, FooterComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesArea') private messagesArea!: ElementRef;

  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private contactRequestService = inject(ContactRequestService);

  currentUser: User | null = null;
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  private subs = new Subscription();
  private messagesSub?: Subscription;
  private shouldScrollBottom = false;

  // Nouvelle conversation
  showNewConvModal = false;
  newConvUserId = '';
  newConvError = '';
  newConvLoading = false;
  contactUsers: { uid: string; displayName: string; photoURL?: string | null }[] = [];

  // Supprimer une conversation
  showDeleteConvModal = false;
  deletingConvId = '';

  // Ajouter un contact par email
  showAddContactModal = false;
  addContactEmail = '';
  addContactLoading = false;
  addContactError = '';
  addContactSuccess = '';

  // Supprimer un contact (uniquement ceux via invitation)
  showRemoveContactModal = false;
  invitationContacts: { uid: string; displayName: string; photoURL?: string | null }[] = [];
  removingContact: { uid: string; displayName: string } | null = null;
  removeContactLoading = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.subs.add(
          this.chatService.getUserConversations(user.uid).subscribe(convs => {
            this.conversations = convs;
          })
        );
        this.loadContacts(user);
      }
    });
  }

  private async loadContacts(user: User): Promise<void> {
    // Lecture Firestore directe pour garantir des données fraîches
    const freshUser = await this.authService.getUserData(user.uid) ?? user;
    const contacts: { uid: string; displayName: string; photoURL?: string | null }[] = [];

    // Contacts issus de la relation tuteur/élève
    if (freshUser.role === 'tutor' && freshUser.studentIds?.length) {
      const profiles = await Promise.all(freshUser.studentIds.map(uid => this.authService.getUserData(uid)));
      profiles.filter(Boolean).forEach(s => contacts.push({
        uid: s!.uid,
        displayName: `${s!.firstName} ${s!.lastName}`,
        photoURL: s!.photoURL
      }));
    } else if (freshUser.role === 'student' && freshUser.tutorId) {
      const t = await this.authService.getUserData(freshUser.tutorId);
      if (t) contacts.push({ uid: t.uid, displayName: `${t.firstName} ${t.lastName}`, photoURL: t.photoURL });
    }

    // Contacts ajoutés via invitation
    if (freshUser.contactIds?.length) {
      const extra = await Promise.all(freshUser.contactIds.map(uid => this.authService.getUserData(uid)));
      const invContacts: typeof this.invitationContacts = [];
      extra.filter(Boolean).forEach(u => {
        const entry = { uid: u!.uid, displayName: `${u!.firstName} ${u!.lastName}`, photoURL: u!.photoURL ?? null };
        invContacts.push(entry);
        if (!contacts.find(c => c.uid === u!.uid)) contacts.push(entry);
      });
      this.invitationContacts = invContacts;
    } else {
      this.invitationContacts = [];
    }

    this.contactUsers = contacts;
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.messagesSub?.unsubscribe();
    this.messagesSub = this.chatService.getMessages(conv.id!).subscribe(msgs => {
      this.messages = msgs;
      this.shouldScrollBottom = true;
      if (this.currentUser) {
        this.chatService.markMessagesAsRead(conv.id!, this.currentUser.uid);
      }
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.selectedConversation || !this.currentUser) return;
    const content = this.newMessage.trim();
    this.newMessage = '';
    await this.chatService.sendMessage(this.selectedConversation.id!, this.currentUser.uid, content);
    this.shouldScrollBottom = true;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async createConversation(): Promise<void> {
    if (!this.newConvUserId || !this.currentUser) return;
    this.newConvError = '';
    this.newConvLoading = true;
    try {
      const targetUser = this.contactUsers.find(u => u.uid === this.newConvUserId);
      if (!targetUser) {
        this.newConvError = 'Utilisateur introuvable.';
        return;
      }
      // Vérification directe Firestore pour éviter les doublons quand le cache local n'est pas à jour
      const existing = await this.chatService.findConversationBetween(
        this.currentUser.uid, targetUser.uid
      );
      if (existing) {
        this.selectConversation(existing);
        this.showNewConvModal = false;
        this.newConvUserId = '';
        return;
      }
      const myDetails = {
        uid: this.currentUser.uid,
        displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        photoURL: this.currentUser.photoURL ?? null
      };
      const targetDetails = {
        uid: targetUser.uid,
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL ?? null
      };
      const convId = await this.chatService.createConversation(
        [this.currentUser.uid, targetUser.uid],
        [myDetails, targetDetails]
      );
      // Auto-sélectionner la nouvelle conversation
      const newConv: Conversation = {
        id: convId,
        participants: [this.currentUser.uid, targetUser.uid],
        participantDetails: [myDetails, targetDetails],
        lastMessage: '',
        createdAt: new Date()
      };
      this.selectConversation(newConv);
      this.showNewConvModal = false;
      this.newConvUserId = '';
    } finally {
      this.newConvLoading = false;
    }
  }

  confirmDeleteConv(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.deletingConvId = id;
    this.showDeleteConvModal = true;
  }

  async deleteConversation(): Promise<void> {
    await this.chatService.deleteConversation(this.deletingConvId);
    if (this.selectedConversation?.id === this.deletingConvId) {
      this.selectedConversation = null;
      this.messages = [];
    }
    this.showDeleteConvModal = false;
  }

  async removeContact(): Promise<void> {
    if (!this.removingContact || !this.currentUser) return;
    this.removeContactLoading = true;
    try {
      await this.contactRequestService.removeContact(this.currentUser.uid, this.removingContact.uid);
      // Mettre à jour les listes locales sans recharger Firestore
      this.invitationContacts = this.invitationContacts.filter(c => c.uid !== this.removingContact!.uid);
      this.contactUsers = this.contactUsers.filter(c => c.uid !== this.removingContact!.uid);
      this.removingContact = null;
      if (!this.invitationContacts.length) this.showRemoveContactModal = false;
    } finally {
      this.removeContactLoading = false;
    }
  }

  async sendContactRequest(): Promise<void> {
    if (!this.addContactEmail.trim() || !this.currentUser) return;
    this.addContactLoading = true;
    this.addContactError = '';
    this.addContactSuccess = '';
    try {
      const target = await this.authService.findUserByEmail(this.addContactEmail.trim());
      if (!target) {
        this.addContactError = 'Aucun utilisateur trouvé avec cet email.';
        return;
      }
      if (target.uid === this.currentUser.uid) {
        this.addContactError = 'Vous ne pouvez pas vous ajouter vous-même.';
        return;
      }
      const alreadyContact = this.contactUsers.some(c => c.uid === target.uid);
      if (alreadyContact) {
        this.addContactError = 'Cet utilisateur est déjà dans vos contacts.';
        return;
      }
      const fromName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      await this.contactRequestService.sendContactRequest(this.currentUser.uid, fromName, target.email);
      this.addContactSuccess = `Invitation envoyée à ${target.email} !`;
      this.addContactEmail = '';
    } catch (e: any) {
      this.addContactError = e?.message || "Erreur lors de l'envoi de l'invitation.";
    } finally {
      this.addContactLoading = false;
    }
  }

  getConvPartner(conv: Conversation): { displayName: string; photoURL?: string | null } {
    if (!this.currentUser) return { displayName: 'Inconnu' };
    // 1. Chercher dans participantDetails stocké avec la conversation
    if (conv.participantDetails?.length) {
      const found = conv.participantDetails.find(p => p.uid !== this.currentUser!.uid);
      if (found?.displayName) return found;
    }
    // 2. Fallback : trouver le partenaire via l'UID dans participants, puis chercher dans contactUsers
    const partnerUid = conv.participants?.find(uid => uid !== this.currentUser!.uid);
    if (partnerUid) {
      const contact = this.contactUsers.find(c => c.uid === partnerUid);
      if (contact) return contact;
    }
    return { displayName: 'Inconnu' };
  }

  isMyMessage(msg: Message): boolean {
    return msg.senderId === this.currentUser?.uid;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatConvDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesArea.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.messagesSub?.unsubscribe();
  }
}
