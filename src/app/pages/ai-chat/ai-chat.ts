import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIChatService } from '../../services/ai-chat.service';
import { AuthService } from '../../services/auth.service';
import { AIChatMessage, ChatHistoryEntry } from '../../models/ai-chat.model';

@Component({
    selector: 'app-ai-chatbot',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-chat.html',
    styleUrl: './ai-chat.css',
})
export class AIChatbot {
    @ViewChild('msgContainer') msgContainer!: ElementRef;

    isOpen = signal(false);
    messages = signal<AIChatMessage[]>([]);
    userInput = '';
    loading = signal(false);
    userName = '';
    userRole = '';

    private idCounter = 0;

    get quickActions(): { label: string; text: string }[] {
        const common = [
            { label: '📝 Apply Leave', text: 'Apply leave' },
            { label: '⏰ Check In', text: 'Check in' },
            { label: '📊 Leave Balance', text: 'Show my leave balance' },
            { label: '📅 Attendance', text: 'Today\'s attendance' },
            { label: '👤 My Profile', text: 'Show my profile' },
            { label: '🎯 My Goals', text: 'Show my goals' },
        ];
        const managerActions = [
            { label: '👥 Team Leaves', text: 'Show team leaves' },
            { label: '✅ Approve Leave', text: 'Approve leave' },
            { label: '📅 Team Attendance', text: 'Team attendance' },
            { label: '📝 Team Reviews', text: 'Show team reviews' },
        ];
        const adminActions = [
            { label: '🏢 Admin Dashboard', text: 'Admin dashboard' },
            { label: '📋 All Leaves', text: 'Show all leaves' },
            { label: '👥 Team Leaves', text: 'Show team leaves' },
            { label: '✅ Approve Leave', text: 'Approve leave' },
            { label: '📅 Team Attendance', text: 'Team attendance' },
        ];

        if (this.userRole === 'ADMIN') return [...adminActions, ...common];
        if (this.userRole === 'MANAGER') return [...managerActions, ...common];
        return [...common, { label: '📢 News', text: 'Show announcements' }];
    }

    constructor(
        private aiService: AIChatService,
        private authService: AuthService
    ) {
        const user = this.authService.currentUser();
        this.userName = user?.name?.split(' ')[0] ?? 'there';
        this.userRole = user?.role ?? 'EMPLOYEE';
    }

    toggle(): void {
        this.isOpen.update(v => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }

    sendMessage(text?: string): void {
        const content = (text ?? this.userInput).trim();
        if (!content || this.loading()) return;

        const userMsg: AIChatMessage = {
            id: ++this.idCounter,
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        this.messages.update(msgs => [...msgs, userMsg]);
        this.userInput = '';
        this.scrollDown();

        const loadingMsg: AIChatMessage = {
            id: ++this.idCounter,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            loading: true
        };
        this.messages.update(msgs => [...msgs, loadingMsg]);
        this.loading.set(true);
        this.scrollDown();

        const history: ChatHistoryEntry[] = this.messages()
            .filter(m => !m.loading)
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content }));

        this.aiService.sendMessage({ message: content, history }).subscribe({
            next: (res) => {
                this.messages.update(msgs => {
                    const filtered = msgs.filter(m => m.id !== loadingMsg.id);
                    return [...filtered, {
                        id: ++this.idCounter,
                        role: 'assistant' as const,
                        content: res.data?.reply ?? 'Sorry, I could not process that.',
                        timestamp: new Date().toISOString(),
                        action: res.data?.action,
                        actionPerformed: res.data?.actionPerformed,
                        quickReplies: res.data?.quickReplies
                    }];
                });
                this.loading.set(false);
                this.scrollDown();
            },
            error: () => {
                this.messages.update(msgs => {
                    const filtered = msgs.filter(m => m.id !== loadingMsg.id);
                    return [...filtered, {
                        id: ++this.idCounter,
                        role: 'assistant' as const,
                        content: 'Connection error. Please check if the backend is running.',
                        timestamp: new Date().toISOString(),
                        quickReplies: ['Help', 'My Dashboard']
                    }];
                });
                this.loading.set(false);
                this.scrollDown();
            }
        });
    }

    onQuickReply(text: string): void {
        this.sendMessage(text);
    }

    isLastAssistantMsg(msg: AIChatMessage): boolean {
        const msgs = this.messages();
        const assistantMsgs = msgs.filter(m => m.role === 'assistant' && !m.loading);
        return assistantMsgs.length > 0 && assistantMsgs[assistantMsgs.length - 1].id === msg.id;
    }

    onKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    clearChat(): void {
        this.messages.set([]);
    }

    scrollDown(): void {
        setTimeout(() => {
            if (this.msgContainer) {
                const el = this.msgContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        }, 80);
    }

    formatTime(d: string): string {
        return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getActionLabel(action: string | null | undefined): string {
        if (!action) return '';
        const m: Record<string, string> = {
            'GET_LEAVE_BALANCE': 'Fetched Leaves',
            'GET_MY_LEAVES': 'Leave List',
            'GET_ATTENDANCE_TODAY': 'Checked Attendance',
            'GET_ATTENDANCE_SUMMARY': 'Got Summary',
            'GET_MY_DASHBOARD': 'Loaded Dashboard',
            'GET_ANNOUNCEMENTS': 'Got Announcements',
            'GET_MY_PROFILE': 'Loaded Profile',
            'GET_HOLIDAYS': 'Fetched Holidays',
            'GET_MY_GOALS': 'Loaded Goals',
            'GET_MY_REVIEWS': 'Loaded Reviews',
            'GET_NOTIFICATIONS': 'Notification Info',
            'APPLY_LEAVE': 'Leave Applied',
            'CANCEL_LEAVE': 'Leave Cancelled',
            'CHECK_IN': 'Checked In',
            'CHECK_OUT': 'Checked Out',
            'UPDATE_PROFILE': 'Profile Updated',
            'CREATE_GOAL': 'Goal Created',
            'GET_TEAM_LEAVES': 'Team Leaves',
            'GET_TEAM_ATTENDANCE': 'Team Attendance',
            'GET_TEAM_REVIEWS': 'Team Reviews',
            'APPROVE_LEAVE': 'Leave Approved',
            'REJECT_LEAVE': 'Leave Rejected',
            'GET_ADMIN_DASHBOARD': 'Admin Dashboard',
            'GET_ALL_LEAVES': 'All Leaves',
        };
        return m[action] ?? action;
    }

    getActionIcon(action: string | null | undefined): string {
        if (!action) return '✓';
        if (action.includes('APPROVE')) return '✅';
        if (action.includes('REJECT')) return '❌';
        if (action.includes('TEAM')) return '👥';
        if (action.includes('ADMIN')) return '🏢';
        if (action.includes('ALL_LEAVES')) return '📋';
        if (action.includes('LEAVE')) return '📝';
        if (action.includes('ATTENDANCE') || action.includes('CHECK')) return '⏰';
        if (action.includes('PROFILE')) return '👤';
        if (action.includes('DASHBOARD')) return '🏠';
        if (action.includes('GOAL')) return '🎯';
        if (action.includes('REVIEW')) return '📊';
        if (action.includes('ANNOUNCEMENT')) return '📢';
        if (action.includes('HOLIDAY')) return '🗓️';
        if (action.includes('NOTIFICATION')) return '🔔';
        return '✓';
    }

    trackMsg(_: number, msg: AIChatMessage): number {
        return msg.id;
    }
}
