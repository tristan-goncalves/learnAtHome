import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './profile-modal.component.scss',
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal__header">
          <h2>Modifier mon profil</h2>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <div class="profile-photo">
          <div class="photo-wrapper" (click)="fileInput.click()">
            <img *ngIf="previewUrl || currentUser?.photoURL"
                 [src]="previewUrl || currentUser?.photoURL"
                 alt="Photo de profil" class="avatar">
            <div *ngIf="!previewUrl && !currentUser?.photoURL"
                 class="avatar avatar--initials">{{ getInitials() }}</div>
            <div class="photo-overlay">
              <span class="material-icons">photo_camera</span>
            </div>
          </div>
          <p class="photo-hint">Cliquez pour changer la photo</p>
          <input #fileInput type="file" accept="image/*" hidden (change)="onFileChange($event)">
        </div>

        <div class="form-fields">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" [(ngModel)]="firstName" placeholder="Votre prénom">
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" [(ngModel)]="lastName" placeholder="Votre nom">
          </div>
        </div>

        <div class="modal-error" *ngIf="errorMsg">
          <span class="material-icons">error_outline</span> {{ errorMsg }}
        </div>

        <div class="modal__actions">
          <button class="btn btn-ghost" (click)="close.emit()">Annuler</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            <span *ngIf="!saving">Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);

  currentUser: User | null = null;
  firstName = '';
  lastName = '';
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  saving = false;
  errorMsg = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.firstName = user.firstName || '';
        this.lastName = user.lastName || '';
      }
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { this.errorMsg = 'Image trop volumineuse (max 5 Mo)'; return; }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl = e.target?.result as string;
      reader.readAsDataURL(file);
      this.errorMsg = '';
    }
  }

  async save(): Promise<void> {
    if (!this.currentUser) return;
    this.saving = true;
    this.errorMsg = '';
    try {
      let photoURL = this.currentUser.photoURL;
      if (this.selectedFile) {
        photoURL = await this.authService.uploadProfilePhotoAsBase64(this.selectedFile);
      }
      await this.authService.updateUserProfile(this.currentUser.uid, {
        firstName: this.firstName,
        lastName: this.lastName,
        photoURL: photoURL || undefined
      });
      this.close.emit();
    } catch {
      this.errorMsg = 'Erreur lors de la sauvegarde. Veuillez réessayer.';
    } finally {
      this.saving = false;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  getInitials(): string {
    return `${this.firstName?.charAt(0) || ''}${this.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  }
}
