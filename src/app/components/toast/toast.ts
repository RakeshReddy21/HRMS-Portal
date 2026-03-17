import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (message()) {
            <div class="fixed top-6 right-6 z-50 animate-toast flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-[13px] font-medium shadow-xl backdrop-blur-xl"
                 [ngClass]="getToastClasses()">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center animate-successPop" [ngClass]="getIconBg()">
                    <svg class="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="getIconPath()"/>
                    </svg>
                </div>
                <span class="font-semibold">{{ message() }}</span>
            </div>
        }
    `,
    styles: []
})
export class ToastComponent {
    message = input<string>('');
    type = input<ToastType>('info');

    getToastClasses(): string {
        switch (this.type()) {
            case 'success': return 'bg-white border border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100/50';
            case 'error':   return 'bg-white border border-rose-200 text-rose-700 shadow-lg shadow-rose-100/50';
            case 'warning': return 'bg-white border border-amber-200 text-amber-700 shadow-lg shadow-amber-100/50';
            default:        return 'bg-white border border-indigo-200 text-indigo-700 shadow-lg shadow-indigo-100/50';
        }
    }

    getIconBg(): string {
        switch (this.type()) {
            case 'success': return 'bg-emerald-50 text-emerald-600';
            case 'error':   return 'bg-rose-50 text-rose-600';
            case 'warning': return 'bg-amber-50 text-amber-600';
            default:        return 'bg-indigo-50 text-indigo-600';
        }
    }

    getIconPath(): string {
        switch (this.type()) {
            case 'success': return 'M5 13l4 4L19 7';
            case 'error':   return 'M6 18L18 6M6 6l12 12';
            case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            default:        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    }
}
