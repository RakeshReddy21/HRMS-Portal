import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
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
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: loading 1.5s ease-in-out infinite;
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

