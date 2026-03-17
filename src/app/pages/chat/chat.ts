import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { WebSocketService, PresenceEvent } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeSelfService } from '../../services/employee-self.service';
import { Conversation, ChatMessage, TypingIndicator } from '../../models/chat.model';
import { EmployeeDirectoryEntry } from '../../models/dashboard.model';

@Component({
    selector: 'app-chat',
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.html',
    styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
    @ViewChild('messageContainer') messageContainer!: ElementRef;
    @ViewChild('messageInput') messageInput!: ElementRef;

    conversations = signal<Conversation[]>([]);
    activeConversation = signal<Conversation | null>(null);
    messages = signal<ChatMessage[]>([]);
    newMessage = '';
    searchQuery = '';
    loading = signal(false);
    loadingMessages = signal(false);
    sendingMessage = signal(false);
    showMobileConversations = signal(true);

    typingUser = signal<string | null>(null);
    private typingTimeout: any = null;
    private myTypingTimeout: any = null;
    private lastTypingSent = 0;
    showNewChatModal = signal(false);
    directoryEmployees = signal<EmployeeDirectoryEntry[]>([]);
    directorySearch = '';
    loadingDirectory = signal(false);
    onlineEmails = signal<Set<string>>(new Set());
    startingChat = signal(false);
    private directorySearchTimeout: any = null;

    currentUserId: number;
    currentUserName: string;
    currentUserEmail: string;

    private subs: Subscription[] = [];

    constructor(
        private chatService: ChatService,
        private wsService: WebSocketService,
        private authService: AuthService,
        private employeeSelfService: EmployeeSelfService
    ) {
        this.currentUserId = this.authService.currentUser()?.employeeId ?? 0;
        this.currentUserName = this.authService.currentUser()?.name ?? '';
        this.currentUserEmail = this.authService.currentUser()?.email ?? '';
    }

    ngOnInit(): void {
        this.loadConversations();
        this.loadOnlineUsers();
        this.setupWebSocket();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        if (this.myTypingTimeout) clearTimeout(this.myTypingTimeout);
        if (this.directorySearchTimeout) clearTimeout(this.directorySearchTimeout);
    }

    loadConversations(): void {
        this.loading.set(true);
        this.chatService.getConversations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.conversations.set(res.data);
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadOnlineUsers(): void {
        this.chatService.getOnlineUsers().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.onlineEmails.set(new Set(res.data));
                }
            },
            error: () => {}
        });
    }

    selectConversation(conv: Conversation): void {
        this.activeConversation.set(conv);
        this.showMobileConversations.set(false);
        this.typingUser.set(null);
        this.loadMessages(conv.conversationId);

        if (conv.unreadCount > 0) {
            this.chatService.markConversationAsRead(conv.conversationId).subscribe({
                next: () => {
                    this.updateConversationUnread(conv.conversationId, 0);
                    this.refreshGlobalChatUnread();
                }
            });
        }
    }

    loadMessages(conversationId: number): void {
        this.loadingMessages.set(true);
        this.messages.set([]);
        this.chatService.getMessages(conversationId, 0, 100).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.messages.set(res.data.content.reverse());
                    this.scrollToBottom();
                }
                this.loadingMessages.set(false);
            },
            error: () => this.loadingMessages.set(false)
        });
    }
    sendMessage(): void {
        const conv = this.activeConversation();
        if (!conv || !this.newMessage.trim()) return;

        this.sendingMessage.set(true);
        const content = this.newMessage.trim();
        this.newMessage = '';

        const payload: { conversationId: number; recipientId: number; content: string; messageType: 'TEXT' } = {
            conversationId: conv.conversationId,
            recipientId: conv.otherParticipantId,
            content: content,
            messageType: 'TEXT'
        };
        const sentOverWs = this.wsService.sendChatMessage(payload);
        if (!sentOverWs) {
            this.chatService.sendMessage(payload).subscribe({
                error: () => {
                    // Keep optimistic UI, but refresh from source of truth on transport errors.
                    this.loadMessages(conv.conversationId);
                    this.loadConversations();
                }
            });
        }

        const optimisticMsg: ChatMessage = {
            messageId: Date.now(),
            conversationId: conv.conversationId,
            senderId: this.currentUserId,
            senderName: this.currentUserName,
            senderCode: '',
            recipientId: conv.otherParticipantId,
            content: content,
            messageType: 'TEXT',
            fileUrl: null,
            fileName: null,
            isRead: false,
            createdAt: new Date().toISOString()
        };

        this.messages.update(msgs => [...msgs, optimisticMsg]);
        this.updateConversationLastMessage(conv.conversationId, content);
        this.scrollToBottom();
        this.sendingMessage.set(false);

        this.wsService.sendTypingIndicator(conv.conversationId, false);
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    onTyping(): void {
        const conv = this.activeConversation();
        if (!conv) return;

        const now = Date.now();
        if (now - this.lastTypingSent > 2000) {
            this.wsService.sendTypingIndicator(conv.conversationId, true);
            this.lastTypingSent = now;
        }

        if (this.myTypingTimeout) clearTimeout(this.myTypingTimeout);
        this.myTypingTimeout = setTimeout(() => {
            this.wsService.sendTypingIndicator(conv.conversationId, false);
        }, 3000);
    }

    openNewChatModal(): void {
        this.showNewChatModal.set(true);
        this.directorySearch = '';
        this.loadDirectory();
    }

    closeNewChatModal(): void {
        this.showNewChatModal.set(false);
        this.directorySearch = '';
        this.directoryEmployees.set([]);
    }

    loadDirectory(): void {
        this.loadingDirectory.set(true);
        this.employeeSelfService.searchDirectory(undefined, undefined, 0, 100).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const employees = res.data.content.filter(
                        e => e.email !== this.currentUserEmail
                    );
                    this.directoryEmployees.set(employees);
                }
                this.loadingDirectory.set(false);
            },
            error: () => this.loadingDirectory.set(false)
        });
    }

    searchDirectory(): void {
        this.loadingDirectory.set(true);
        const keyword = this.directorySearch.trim() || undefined;
        this.employeeSelfService.searchDirectory(keyword, undefined, 0, 100).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const employees = res.data.content.filter(
                        e => e.email !== this.currentUserEmail
                    );
                    this.directoryEmployees.set(employees);
                }
                this.loadingDirectory.set(false);
            },
            error: () => this.loadingDirectory.set(false)
        });
    }

    onDirectorySearchChange(): void {
        if (this.directorySearchTimeout) clearTimeout(this.directorySearchTimeout);
        this.directorySearchTimeout = setTimeout(() => {
            this.searchDirectory();
        }, 350);
    }

    startConversation(employee: EmployeeDirectoryEntry): void {
        this.startingChat.set(true);
        this.chatService.getOrCreateConversation(employee.employeeId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const newConv: Conversation = res.data;
                    this.closeNewChatModal();
                    const existing = this.conversations().find(
                        c => c.conversationId === newConv.conversationId
                    );
                    if (!existing) {
                        this.conversations.update(convs => [newConv, ...convs]);
                    }
                    this.selectConversation(newConv);
                    this.refreshConversationsQuietly();

                    this.startingChat.set(false);
                } else {
                    console.error('Failed to create conversation:', res.message);
                    this.startingChat.set(false);
                }
            },
            error: (err) => {
                console.error('Error creating conversation:', err);
                this.startingChat.set(false);
            }
        });
    }

    isEmployeeOnline(email: string): boolean {
        return this.onlineEmails().has(email);
    }

    isConversationOnline(conv: Conversation): boolean {
        if (conv.otherParticipantEmail) {
            return this.onlineEmails().has(conv.otherParticipantEmail);
        }
        return !!conv.online;
    }
    getFirstName(name: string): string {
        if (!name) return '';
        return name.split(' ')[0];
    }
    getNameAndDesignation(conv: Conversation): string {
        const firstName = this.getFirstName(conv.otherParticipantName);
        const designation = (conv.otherParticipantDesignation || '').trim();
        return designation ? `${firstName} - ${designation}` : firstName;
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'ADMIN': return 'role-admin';
            case 'MANAGER': return 'role-manager';
            case 'EMPLOYEE': return 'role-employee';
            default: return 'role-employee';
        }
    }

    private setupWebSocket(): void {
        this.subs.push(
            this.wsService.chatMessage$.subscribe((msg: ChatMessage) => {
                const conv = this.activeConversation();
                if (conv && msg.conversationId === conv.conversationId) {
                    const isDuplicate = this.messages().some(
                        m => m.senderId === msg.senderId &&
                            m.content === msg.content &&
                            Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000
                    );
                    if (!isDuplicate) {
                        this.messages.update(msgs => [...msgs, msg]);
                        this.scrollToBottom();
                    }
                    this.chatService.markConversationAsRead(conv.conversationId).subscribe({
                        next: () => this.refreshGlobalChatUnread()
                    });
                } else {
                    this.conversations.update(convs =>
                        convs.map(c =>
                            c.conversationId === msg.conversationId
                                ? { ...c, unreadCount: c.unreadCount + 1, lastMessageText: msg.content, lastMessageAt: msg.createdAt }
                                : c
                        )
                    );
                }
                this.updateConversationLastMessage(msg.conversationId, msg.content);
                this.reorderConversations();
            })
        );

        this.subs.push(
            this.wsService.typing$.subscribe((indicator: TypingIndicator) => {
                const conv = this.activeConversation();
                if (conv && indicator.conversationId === conv.conversationId && indicator.senderId !== this.currentUserId) {
                    if (indicator.typing) {
                        this.typingUser.set(indicator.senderName);
                        if (this.typingTimeout) clearTimeout(this.typingTimeout);
                        this.typingTimeout = setTimeout(() => {
                            this.typingUser.set(null);
                        }, 4000);
                    } else {
                        this.typingUser.set(null);
                        if (this.typingTimeout) clearTimeout(this.typingTimeout);
                    }
                }
            })
        );
        this.subs.push(
            this.wsService.presence$.subscribe((event: PresenceEvent) => {
                this.onlineEmails.update(set => {
                    const newSet = new Set(set);
                    if (event.online) {
                        newSet.add(event.email);
                    } else {
                        newSet.delete(event.email);
                    }
                    return newSet;
                });
                this.conversations.update(convs =>
                    convs.map(c =>
                        c.otherParticipantEmail === event.email
                            ? { ...c, online: event.online }
                            : c
                    )
                );
                const active = this.activeConversation();
                if (active && active.otherParticipantEmail === event.email) {
                    this.activeConversation.set({ ...active, online: event.online });
                }
            })
        );
    }

    private refreshGlobalChatUnread(): void {
        this.chatService.getUnreadCount().subscribe({
            next: (res) => {
                if (res.success && res.data !== undefined) {
                    this.wsService.chatUnread$.next(res.data);
                }
            }
        });
    }

    private updateConversationUnread(conversationId: number, count: number): void {
        this.conversations.update(convs =>
            convs.map(c =>
                c.conversationId === conversationId ? { ...c, unreadCount: count } : c
            )
        );
    }

    private updateConversationLastMessage(conversationId: number, text: string): void {
        this.conversations.update(convs =>
            convs.map(c =>
                c.conversationId === conversationId
                    ? { ...c, lastMessageText: text, lastMessageAt: new Date().toISOString() }
                    : c
            )
        );
    }

    private reorderConversations(): void {
        this.conversations.update(convs =>
            [...convs].sort((a, b) => {
                const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return bTime - aTime;
            })
        );
    }

    private refreshConversationsQuietly(): void {
        this.chatService.getConversations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const active = this.activeConversation();
                    this.conversations.set(res.data);
                    if (active) {
                        const updated = res.data.find(c => c.conversationId === active.conversationId);
                        if (updated) {
                            this.activeConversation.set(updated);
                        }
                    }
                }
            }
        });
    }

    scrollToBottom(): void {
        setTimeout(() => {
            if (this.messageContainer) {
                const el = this.messageContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        }, 50);
    }

    goBackToList(): void {
        this.showMobileConversations.set(true);
        this.activeConversation.set(null);
    }

    get filteredConversations(): Conversation[] {
        const query = this.searchQuery.toLowerCase().trim();
        if (!query) return this.conversations();
        return this.conversations().filter(c =>
            (c.otherParticipantName || '').toLowerCase().includes(query) ||
            (c.otherParticipantCode || '').toLowerCase().includes(query) ||
            (c.otherParticipantDepartment || '').toLowerCase().includes(query)
        );
    }

    getInitials(name: string): string {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    isMyMessage(msg: ChatMessage): boolean {
        return msg.senderId === this.currentUserId;
    }

    formatTime(dateStr: string | null): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    formatMessageTime(dateStr: string): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    trackByConversationId(_: number, conv: Conversation): number {
        return conv.conversationId;
    }

    trackByMessageId(_: number, msg: ChatMessage): number {
        return msg.messageId;
    }
}
