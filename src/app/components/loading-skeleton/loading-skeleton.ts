import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
            @if (type() === 'card') {
                <div class="space-y-4">
                    <div class="skeleton h-6 w-3/4 rounded"></div>
                    <div class="skeleton h-4 w-full rounded"></div>
                    <div class="skeleton h-4 w-5/6 rounded"></div>
                </div>
            } @else if (type() === 'table') {
                <div class="space-y-3">
                    @for (i of getRowsArray(); track $index) {
                        <div class="flex items-center gap-4">
                            <div class="skeleton w-12 h-12 rounded-xl"></div>
                            <div class="flex-1 space-y-2">
                                <div class="skeleton h-4 w-48 rounded"></div>
                                <div class="skeleton h-3 w-32 rounded"></div>
                            </div>
                        </div>
                    }
                </div>
            } @else if (type() === 'list') {
                <div class="space-y-3">
                    @for (i of getRowsArray(); track $index) {
                        <div class="skeleton h-16 w-full rounded-xl"></div>
                    }
                </div>
            } @else {
                <div class="space-y-3">
                    @for (i of getRowsArray(); track $index) {
                        <div class="skeleton h-4 w-full rounded"></div>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .skeleton {
            background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%, #e2e8f0 100%);
            background-size: 300% 100%;
            animation: loading 2s ease-in-out infinite;
        }
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `]
})
export class LoadingSkeletonComponent {
    type = input<'card' | 'table' | 'list' | 'default'>('default');
    rows = input(5);

    getRowsArray(): number[] {
        return new Array(this.rows()).fill(0);
    }
}
