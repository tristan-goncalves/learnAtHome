// USER
export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  role: 'student' | 'tutor';
  createdAt: Date;
}

// TASK
export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  userId: string;
  createdAt: Date;
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
  participantDetails?: { uid: string; displayName: string; photoURL?: string }[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  createdAt: Date;
}
