import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="iconPath()"/>
                </svg>
            </div>
            <h3 class="text-slate-800 text-lg font-semibold mb-2">{{ title() }}</h3>
            <p class="text-slate-500 text-[13px]">{{ message() }}</p>
            @if (actionLabel() && actionHandler()) {
                <button (click)="actionHandler()!()"
                        class="mt-6 px-6 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-[13px] font-medium hover:bg-indigo-100 transition-colors">
                    {{ actionLabel() }}
                </button>
            }
        </div>
    `,
    styles: []
})
export class EmptyStateComponent {
    title = input('No Data');
    message = input('No items found.');
    iconPath = input('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');
    actionLabel = input<string | undefined>(undefined);
    actionHandler = input<(() => void) | undefined>(undefined);
}

