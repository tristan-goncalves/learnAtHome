import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { User } from '../../../core/models/models';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);

  currentUser: User | null = null;
  unreadCount = 0;
  showProfileModal = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUnreadCount(user.uid);
      }
    });
  }

  async loadUnreadCount(userId: string): Promise<void> {
    this.unreadCount = await this.chatService.getUnreadCount(userId);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName?.charAt(0) || ''}${this.currentUser.lastName?.charAt(0) || ''}`.toUpperCase();
  }
}
