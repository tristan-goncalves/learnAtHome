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
  newConvEmail = '';
  newConvError = '';
  newConvLoading = false;

  // Supprimer une conversation
  showDeleteConvModal = false;
  deletingConvId = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.subs.add(
          this.chatService.getUserConversations(user.uid).subscribe(convs => {
            this.conversations = convs;
          })
        );
      }
    });
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
    if (!this.newConvEmail || !this.currentUser) return;
    this.newConvError = '';
    this.newConvLoading = true;
    try {
      const targetUser = await this.chatService.findUserByEmail(this.newConvEmail);
      if (!targetUser) {
        this.newConvError = 'Aucun utilisateur trouvé avec cet email.';
        return;
      }
      if (targetUser.uid === this.currentUser.uid) {
        this.newConvError = 'Vous ne pouvez pas démarrer une conversation avec vous-même.';
        return;
      }
      const existing = this.conversations.find(c =>
        c.participants.includes(targetUser.uid) && c.participants.includes(this.currentUser!.uid)
      );
      if (existing) {
        this.selectConversation(existing);
        this.showNewConvModal = false;
        return;
      }
      const myDetails = {
        uid: this.currentUser.uid,
        displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        photoURL: this.currentUser.photoURL
      };
      const id = await this.chatService.createConversation(
        [this.currentUser.uid, targetUser.uid],
        [myDetails, targetUser]
      );
      this.showNewConvModal = false;
      this.newConvEmail = '';
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

  getConvPartner(conv: Conversation): { displayName: string; photoURL?: string } {
    if (!this.currentUser || !conv.participantDetails) return { displayName: 'Inconnu' };
    return conv.participantDetails.find(p => p.uid !== this.currentUser!.uid) || { displayName: 'Inconnu' };
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
