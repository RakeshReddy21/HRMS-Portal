import { Injectable, signal, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PresenceEvent {
    email: string;
    online: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
    private client: Client | null = null;
    private subscriptions: StompSubscription[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    connected = signal(false);
    readonly chatMessage$ = new Subject<any>();
    readonly typing$ = new Subject<any>();
    readonly notification$ = new Subject<any>();
    readonly chatUnread$ = new Subject<number>();
    readonly presence$ = new Subject<PresenceEvent>();
    constructor(private authService: AuthService) {}
    private resolveBrokerUrl(): string {
        if (environment.wsUrl.startsWith('ws://') || environment.wsUrl.startsWith('wss://')) {
            return environment.wsUrl;
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}${environment.wsUrl}`;
    }
    connect(): void {
        if (this.client?.active) return;
        const token = this.authService.getAccessToken();
        if (!token) return;
        this.client = new Client({
            brokerURL: this.resolveBrokerUrl(),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: () => {},
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });
        this.client.onConnect = () => {
            this.connected.set(true);
            this.reconnectAttempts = 0;
            this.subscribeToChannels();
        };
        this.client.onDisconnect = () => {
            this.connected.set(false);
        };
        this.client.onStompError = (frame) => {
            console.error('STOMP error:', frame.headers['message']);
            this.connected.set(false);
        };
        this.client.onWebSocketClose = () => {
            this.connected.set(false);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.client?.deactivate();
            }
        };
        this.client.activate();
    }
    disconnect(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions = [];
        if (this.client?.active) {
            this.client.deactivate();
        }
        this.client = null;
        this.connected.set(false);
        this.reconnectAttempts = 0;
    }
    private subscribeToChannels(): void {
        if (!this.client?.connected) return;
        this.addSubscription(
            this.client.subscribe('/user/queue/messages', (msg: IMessage) => {
                this.chatMessage$.next(JSON.parse(msg.body));
            })
        );
        this.addSubscription(
            this.client.subscribe('/user/queue/typing', (msg: IMessage) => {
                this.typing$.next(JSON.parse(msg.body));
            })
        );
        this.addSubscription(
            this.client.subscribe('/user/queue/notifications', (msg: IMessage) => {
                this.notification$.next(JSON.parse(msg.body));
            })
        );
        this.addSubscription(
            this.client.subscribe('/user/queue/chat-unread', (msg: IMessage) => {
                const data = JSON.parse(msg.body);
                this.chatUnread$.next(data.unreadCount);
            })
        );
        this.addSubscription(
            this.client.subscribe('/topic/presence', (msg: IMessage) => {
                this.presence$.next(JSON.parse(msg.body));
            })
        );
    }
    sendChatMessage(payload: any): boolean {
        if (!this.client?.connected) {
            return false;
        }
        this.client.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(payload)
        });
        return true;
    }
    sendTypingIndicator(conversationId: number, typing: boolean): void {
        if (this.client?.connected) {
            this.client.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({ conversationId, typing })
            });
        }
    }
    private addSubscription(sub: StompSubscription): void {
        this.subscriptions.push(sub);
    }
    ngOnDestroy(): void {
        this.disconnect();
    }
}
