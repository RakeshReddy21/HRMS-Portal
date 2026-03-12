import { Component, OnInit, signal } from '@angular/core';
import { ActivityLogService } from '../../../services/activity-log.service';
import { ActivityLog } from '../../../models/dashboard.model';

@Component({
    selector: 'app-activity-logs',
    standalone: true,
    imports: [],
    templateUrl: './activity-logs.html',
    styleUrl: './activity-logs.css',
})
export class ActivityLogs implements OnInit {
    logs = signal<ActivityLog[]>([]);
    loading = signal(true);
    error = signal('');

    page = signal(0);
    totalPages = signal(0);
    totalElements = signal(0);
    pageSize = 20;

    entityTypeFilter = signal('');
    dateFrom = signal('');
    dateTo = signal('');
    activeFilterMode = signal<'all' | 'entity' | 'date'>('all');

    skeletonRows = Array(8).fill(0);

    entityTypes: string[] = [
        'EMPLOYEE', 'DEPARTMENT', 'DESIGNATION', 'LEAVE_TYPE',
        'HOLIDAY', 'LEAVE_APPLICATION', 'ANNOUNCEMENT', 'ATTENDANCE', 'AUTH'
    ];

    constructor(private activityLogService: ActivityLogService) {}

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(): void {
        this.loading.set(true);
        this.error.set('');

        const mode = this.activeFilterMode();

        if (mode === 'entity' && this.entityTypeFilter()) {
            this.activityLogService
                .getByEntityType(this.entityTypeFilter(), this.page(), this.pageSize)
                .subscribe({
                    next: (res) => this.handleResponse(res),
                    error: (err) => this.handleError(err),
                });
        } else if (mode === 'date' && this.dateFrom() && this.dateTo()) {
            this.activityLogService
                .getByDateRange(this.dateFrom(), this.dateTo(), this.page(), this.pageSize)
                .subscribe({
                    next: (res) => this.handleResponse(res),
                    error: (err) => this.handleError(err),
                });
        } else {
            this.activityLogService
                .getAll(this.page(), this.pageSize)
                .subscribe({
                    next: (res) => this.handleResponse(res),
                    error: (err) => this.handleError(err),
                });
        }
    }

    private handleResponse(res: any): void {
        if (res.success && res.data) {
            this.logs.set(res.data.content);
            this.totalPages.set(res.data.totalPages);
            this.totalElements.set(res.data.totalElements);
        }
        this.loading.set(false);
    }

    private handleError(err: any): void {
        this.error.set(err.error?.message || 'Failed to load activity logs');
        this.loading.set(false);
    }

    
    onEntityTypeChange(event: Event): void {
        const val = (event.target as HTMLSelectElement).value;
        this.entityTypeFilter.set(val);
        if (val) {
            this.activeFilterMode.set('entity');
        } else {
            this.activeFilterMode.set('all');
        }
        this.page.set(0);
        this.loadLogs();
    }

    onDateFromChange(event: Event): void {
        this.dateFrom.set((event.target as HTMLInputElement).value);
        this.tryDateFilter();
    }

    onDateToChange(event: Event): void {
        this.dateTo.set((event.target as HTMLInputElement).value);
        this.tryDateFilter();
    }

    private tryDateFilter(): void {
        if (this.dateFrom() && this.dateTo()) {
            this.entityTypeFilter.set('');
            this.activeFilterMode.set('date');
            this.page.set(0);
            this.loadLogs();
        }
    }

    clearFilters(): void {
        this.entityTypeFilter.set('');
        this.dateFrom.set('');
        this.dateTo.set('');
        this.activeFilterMode.set('all');
        this.page.set(0);
        this.loadLogs();
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadLogs();
        }
    }

    getActionClass(action: string): string {
        const lower = action.toLowerCase();
        if (lower.includes('create') || lower.includes('register')) {
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }
        if (lower.includes('update') || lower.includes('edit') || lower.includes('modify')) {
            return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        }
        if (lower.includes('delete') || lower.includes('remove') || lower.includes('deactivat')) {
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        }
        if (lower.includes('login') || lower.includes('logout') || lower.includes('auth')) {
            return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
        }
        if (lower.includes('approv')) {
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }
        if (lower.includes('reject')) {
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        }
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }

    getEntityIcon(entityType: string): string {
        switch (entityType) {
            case 'EMPLOYEE': return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z';
            case 'DEPARTMENT': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
            case 'DESIGNATION': return 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
            case 'LEAVE_TYPE':
            case 'LEAVE_APPLICATION': return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
            case 'HOLIDAY': return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
            case 'ANNOUNCEMENT': return 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z';
            case 'ATTENDANCE': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'AUTH': return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
            default: return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
        }
    }

    getStatusClass(status: string | null): string {
        if (!status) return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        switch (status.toUpperCase()) {
            case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'FAILURE':
            case 'FAILED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'WARNING': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    formatDateTime(value: any): string {
        if (!value) return '—';
        try {
            if (Array.isArray(value)) {
                const arr = value as number[];
                const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1, arr[3] || 0, arr[4] || 0, arr[5] || 0);
                return d.toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
            }
            const d = new Date(value);
            if (isNaN(d.getTime())) return value;
            return d.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        } catch {
            return String(value);
        }
    }

    formatEntityType(et: string): string {
        return et.replace(/_/g, ' ');
    }

    getPerformerName(log: ActivityLog): string {
        if (!log.performedBy) return 'System';
        return `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''}`.trim() || 'Unknown';
    }

    getPerformerInitials(log: ActivityLog): string {
        if (!log.performedBy) return 'SY';
        return ((log.performedBy.firstName?.[0] || '') + (log.performedBy.lastName?.[0] || '')).toUpperCase() || '?';
    }

    get hasActiveFilters(): boolean {
        return this.activeFilterMode() !== 'all';
    }
}

