// USER
export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  role: 'student' | 'tutor';
  createdAt: Date;
  tutorId?: string; // UID du tuteur (uniquement pour les élèves)
  studentIds?: string[]; // UIDs des élèves (uniquement pour les tuteurs)
  contactIds?: string[]; // UIDs des contacts ajoutés via invitation
}

// CONTACT REQUEST
export interface ContactRequest {
  id?: string;
  fromUid: string;
  fromDisplayName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// TASK
export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  userId: string; // UID de la personne à qui la tâche est assignée
  createdAt: Date;
  createdBy?: string; // UID du créateur si différent (tuteur qui crée pour un élève)
}

// EVENT
export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  date: Date;
  creatorId: string;
  participants: string[]; // array of user UIDs
  participantPhotos?: { uid: string; photoURL?: string; displayName: string }[];
  createdAt: Date;
}

// MESSAGE
export interface Message {
  id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

// CONVERSATION
export interface Conversation {
  id?: string;
  participants: string[]; // array of UIDs
  participantDetails?: { uid: string; displayName: string; photoURL?: string | null }[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  createdAt: Date;
}
