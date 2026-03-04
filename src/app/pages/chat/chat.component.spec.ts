import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ContactRequestService } from '../../core/services/contact-request.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Conversation, Message, User } from '../../core/models/models';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  const mockUser: User = {
    uid: 'uid-current',
    email: 'alice@test.com',
    firstName: 'Alice',
    lastName: 'Martin',
    role: 'tutor',
    createdAt: new Date()
  };

  const mockConversation: Conversation = {
    id: 'conv-1',
    participants: ['uid-current', 'uid-partner'],
    participantDetails: [
      { uid: 'uid-current', displayName: 'Alice Martin', photoURL: null },
      { uid: 'uid-partner', displayName: 'Bob Dupont', photoURL: null }
    ],
    lastMessage: 'Bonjour',
    createdAt: new Date()
  };

  beforeEach(async () => {
    const authSpy = {
      currentUser$: of(mockUser),
      getUserData: jest.fn().mockResolvedValue(mockUser)
    };
    const chatSpy = {
      getUserConversations: jest.fn().mockReturnValue(of([])),
      getMessages: jest.fn().mockReturnValue(of([])),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      markMessagesAsRead: jest.fn().mockResolvedValue(undefined),
      createConversation: jest.fn(),
      findConversationBetween: jest.fn(),
      deleteConversation: jest.fn()
    };
    const contactSpy = {
      removeContact: jest.fn(),
      sendContactRequest: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ChatService, useValue: chatSpy },
        { provide: ContactRequestService, useValue: contactSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(ChatComponent, {
        remove: { imports: [HeaderComponent, NavbarComponent, FooterComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it("isMyMessage() retourne true pour l'utilisateur courant", () => {
    component.currentUser = mockUser;
    const msg: Message = { senderId: 'uid-current', content: 'Salut', timestamp: new Date(), read: false };
    expect(component.isMyMessage(msg)).toBe(true);
  });

  it('getConvPartner() retourne le partenaire via participantDetails', () => {
    component.currentUser = mockUser;
    const partner = component.getConvPartner(mockConversation);
    expect(partner.displayName).toBe('Bob Dupont');
  });

  it('sendMessage() appelle chatService.sendMessage avec le contenu correct', async () => {
    const chatService = TestBed.inject(ChatService) as any;
    component.currentUser = mockUser;
    component.selectedConversation = mockConversation;
    component.newMessage = 'Bonjour Bob !';

    await component.sendMessage();

    expect(chatService.sendMessage).toHaveBeenCalledWith('conv-1', 'uid-current', 'Bonjour Bob !');
    expect(component.newMessage).toBe('');
  });
});
