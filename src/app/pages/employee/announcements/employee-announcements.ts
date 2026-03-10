import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { Announcement } from '../../../models/dashboard.model';

@Component({
    selector: 'app-employee-announcements',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './employee-announcements.html',
    styleUrl: './employee-announcements.css',
})
export class EmployeeAnnouncements implements OnInit {
    loading = signal(true);
    announcements = signal<Announcement[]>([]);
    page = signal(0);
    pageSize = 10;
    totalPages = signal(0);
    totalElements = signal(0);

    selectedAnnouncement = signal<Announcement | null>(null);

    skeletonRows = Array(5).fill(0);

    constructor(private empService: EmployeeSelfService) {}

    ngOnInit(): void {
        this.loadAnnouncements();
    }

    loadAnnouncements(): void {
        this.loading.set(true);
        this.empService.getAnnouncements(this.page(), this.pageSize).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.announcements.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadAnnouncements();
        }
    }

    openDetail(a: Announcement): void {
        this.selectedAnnouncement.set(a);
    }

    closeDetail(): void {
        this.selectedAnnouncement.set(null);
    }

    getPriorityClass(priority: string): string {
        switch (priority?.toUpperCase()) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'HIGH': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'MEDIUM': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'LOW': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    getPriorityIcon(priority: string): string {
        switch (priority?.toUpperCase()) {
            case 'CRITICAL': return '🔴';
            case 'HIGH': return '🟠';
            case 'MEDIUM': return '🔵';
            case 'LOW': return '⚪';
            default: return '📢';
        }
    }

    formatDate(value: any): string {
        if (!value) return '';
        let str: string;
        if (typeof value === 'string') {
            str = value.split('T')[0];
        } else if (Array.isArray(value)) {
            str = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        } else {
            return '';
        }
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatDateTime(value: any): string {
        if (!value) return '';
        try {
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    }

    isExpired(endDate: any): boolean {
        if (!endDate) return false;
        const now = new Date();
        const d = new Date(endDate);
        return d < now;
    }

    getTimeAgo(value: any): string {
        if (!value) return '';
        try {
            const d = new Date(value);
            const now = new Date();
            const diff = now.getTime() - d.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 7) return `${days} days ago`;
            if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
            return `${Math.floor(days / 30)} months ago`;
        } catch {
            return '';
        }
    }
}

