import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (message()) {
            <div class="fixed top-6 right-6 z-50 animate-fadeIn flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium shadow-2xl"
                 [ngClass]="getToastClasses()">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath()"/>
                </svg>
                <span>{{ message() }}</span>
            </div>
        }
    `,
    styles: []
})
export class ToastComponent {
    message = input<string>('');
    type = input<ToastType>('info');

    getToastClasses(): string {
        const base = 'border';
        switch (this.type()) {
            case 'success':
                return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400`;
            case 'error':
                return `${base} bg-red-500/10 border-red-500/20 text-red-400`;
            case 'warning':
                return `${base} bg-amber-500/10 border-amber-500/20 text-amber-400`;
            default:
                return `${base} bg-blue-500/10 border-blue-500/20 text-blue-400`;
        }
    }

    getIconPath(): string {
        switch (this.type()) {
            case 'success':
                return 'M5 13l4 4L19 7';
            case 'error':
                return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'warning':
                return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            default:
                return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    }
}

