import { Component, input, output, signal, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { BUTTON_NAV_ITEMS, getNavSections, LOGOUT_ICON_PATHS, NavItem, NavSection } from "../nav-config";
import { AuthService } from "../../services/auth.service";
import { ChatService } from "../../services/chat.service";
import { WebSocketService } from "../../services/websocket.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})

export class sidebar implements OnInit, OnDestroy {
    isOpen = input<boolean>(false);
    closeSidebar = output<void>();
    sections: NavSection[] = [];
    bottonItems: NavItem[] = BUTTON_NAV_ITEMS;
    logoutIconPaths = LOGOUT_ICON_PATHS;
    chatUnreadCount = signal(0);
    private chatUnreadDebounce: any = null;
    private subs: Subscription[] = [];
    
    constructor(
        private authService: AuthService,
        private chatService: ChatService,
        private wsService: WebSocketService,
        private router: Router
    ){
        const role = this.authService.getRole();
        if(role){
            this.sections = getNavSections(role);
        }
    }

    ngOnInit(): void {
        this.loadChatUnread();
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
                    this.loadChatUnread();
                }
            })
        );
    }

    ngOnDestroy(): void {
        if (this.chatUnreadDebounce) clearTimeout(this.chatUnreadDebounce);
        this.subs.forEach(s => s.unsubscribe());
    }

    loadChatUnread(): void {
        this.chatService.getUnreadCount().subscribe({
            next: (res) => {
                if (res.success && res.data !== undefined) {
                    this.chatUnreadCount.set(res.data);
                }
            }
        });
    }

    onLogout(): void{
        this.wsService.disconnect();
        this.authService.logout();
    }
    onNavClick(): void{
        if(window.innerWidth < 1024){
            this.closeSidebar.emit();
        }
    }

    isChatItem(item: NavItem): boolean {
        return item.route === '/chat';
    }
}