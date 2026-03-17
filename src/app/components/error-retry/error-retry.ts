import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-error-retry',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h3 class="text-slate-800 text-lg font-semibold mb-2">{{ title() }}</h3>
            <p class="text-slate-500 text-[13px] mb-6">{{ message() }}</p>
            <button (click)="onRetry.emit()"
                    class="px-6 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-[13px] font-medium hover:bg-indigo-100 transition-colors">
                <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Retry
                </span>
            </button>
        </div>
    `,
    styles: []
})
export class ErrorRetryComponent {
    title = input('Error Loading Data');
    message = input('Something went wrong. Please try again.');
    onRetry = output<void>();
}

