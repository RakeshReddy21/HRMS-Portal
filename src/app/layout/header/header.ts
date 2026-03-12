import { Component, ElementRef, HostListener, OnInit, OnDestroy, output, signal } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { NotificationService } from "../../services/notification.service";
import { WebSocketService } from "../../services/websocket.service";
import { ChatService } from "../../services/chat.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-header',
    imports: [CommonModule, DatePipe],
    templateUrl: './header.html',
    styleUrl: './header.css',
})

export class Header implements OnInit, OnDestroy {
    toggleSidebar = output<void>();
    showProfileMenu = signal(false);
    showNotificationMenu = signal(false);
    unreadCount = signal(0);
    chatUnreadCount = signal(0);
    notifications = signal<any[]>([]);
    loadingNotifications = signal(false);

    private notificationInterval: any;
    private chatUnreadDebounce: any = null;
    private subs: Subscription[] = [];

    constructor(
        private authService: AuthService,
        private router: Router,
        private elementRef: ElementRef,
        private notificationService: NotificationService,
        private wsService: WebSocketService,
        private chatService: ChatService
    ) {}

    ngOnInit(): void {
        this.loadUnreadCount();
        this.loadChatUnreadCount();
        this.connectWebSocket();
        this.setupRealtimeListeners();

        this.notificationInterval = setInterval(() => {
            this.loadUnreadCount();
            this.loadChatUnreadCount();
        }, 60000);
    }

    ngOnDestroy(): void {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        if (this.chatUnreadDebounce) {
            clearTimeout(this.chatUnreadDebounce);
        }
        this.subs.forEach(s => s.unsubscribe());
    }

    private connectWebSocket(): void {
        this.wsService.connect();
    }

    private setupRealtimeListeners(): void {
        this.subs.push(
            this.wsService.notification$.subscribe((_notif) => {
                this.unreadCount.update(c => c + 1);
                if (this.showNotificationMenu()) {
                    this.loadNotifications();
                }
            })
        );

        this.subs.push(
            this.wsService.chatUnread$.subscribe((count: number) => {
                if (this.router.url.startsWith('/chat')) {
                    if (this.chatUnreadDebounce) clearTimeout(this.chatUnreadDebounce);
                    this.chatUnreadDebounce = setTimeout(() => {
                        this.chatUnreadCount.set(count);
                    }, 300);
                } else {
                    this.chatUnreadCount.set(count);
                }
            })
        );

        this.subs.push(
            this.wsService.chatMessage$.subscribe(() => {
                if (!this.router.url.startsWith('/chat')) {
                    this.loadChatUnreadCount();
                }
            })
        );
    }

    loadChatUnreadCount(): void {
        this.chatService.getUnreadCount().subscribe({
            next: (res) => {
                if (res.success && res.data !== undefined) {
                    this.chatUnreadCount.set(res.data);
                }
            },
            error: () => {}
        });
    }

    loadUnreadCount(): void {
        this.notificationService.getUnreadCount().subscribe({
            next: (res) => {
                if (res.success && res.data !== undefined) {
                    this.unreadCount.set(res.data);
                }
            },
            error: () => {}
        });
    }

    toggleNotificationMenu(): void {
        if (!this.showNotificationMenu()) {
            this.loadNotifications();
        }
        this.showNotificationMenu.update(v => !v);
    }

    loadNotifications(): void {
        this.loadingNotifications.set(true);
        this.notificationService.getNotifications(undefined, 0, 10).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.notifications.set(res.data.content);
                }
                this.loadingNotifications.set(false);
            },
            error: () => this.loadingNotifications.set(false)
        });
    }

    markAsRead(notificationId: number): void {
        this.notificationService.markAsRead(notificationId).subscribe({
            next: () => {
                this.loadUnreadCount();
                this.loadNotifications();
            }
        });
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead().subscribe({
            next: () => {
                this.loadUnreadCount();
                this.loadNotifications();
            }
        });
    }
    get userEmail(): string {
        return this.authService.currentUser()?.email || '';
    }
    get userName(): string{
        return this.authService.currentUser()?.name || 'User';
    }
    get userRole(): string{
        return this.authService.currentUser()?.role || '';
    }
    get userInitials(): string{
        const name = this.userName;
        const parts = name.split(' ');
        if(parts.length >= 2){
            return (parts[0][0] + parts[1][0].toUpperCase());
        }
        return name.substring(0, 2).toUpperCase();
    }
    toggleProfileMenu(): void{
        this.showProfileMenu.update(v => !v);
    }
    goToChat(): void {
        this.router.navigate(['/chat']);
    }
    goToSettings(): void{
        this.showProfileMenu.set(false);
        this.router.navigate(['/settings']);
    }
    onLogout(): void{
        this.showProfileMenu.set(false);
        this.wsService.disconnect();
        this.authService.logout();
    }
    @HostListener('document:click', ['$event'])
    onDocumnetClick(event: Event): void{
        if(!this.elementRef.nativeElement.contains(event.target)){
            this.showProfileMenu.set(false);
            this.showNotificationMenu.set(false);
        }
    }
}
