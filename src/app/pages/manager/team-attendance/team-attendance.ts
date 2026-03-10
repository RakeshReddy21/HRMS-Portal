import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerService } from '../../../services/manager.service';
import { AttendanceRecord } from '../../../models/dashboard.model';

@Component({
    selector: 'app-team-attendance',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule],
    templateUrl: './team-attendance.html',
    styleUrl: './team-attendance.css',
})
export class TeamAttendance implements OnInit {
    attendance = signal<AttendanceRecord[]>([]);
    loading = signal(true);
    error = signal('');

    dateFilter = 'today';
    startDate = '';
    endDate = '';

    skeletonRows = Array(8).fill(0);

    constructor(private managerService: ManagerService) {}

    ngOnInit(): void {
        this.loadTodayAttendance();
    }

    loadTodayAttendance(): void {
        this.loading.set(true);
        this.error.set('');
        this.managerService.getTeamAttendanceToday().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.attendance.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load attendance');
                this.loading.set(false);
            }
        });
    }

    loadRangeAttendance(): void {
        if (!this.startDate || !this.endDate) {
            this.error.set('Please select both start and end dates');
            return;
        }
        this.loading.set(true);
        this.error.set('');
        this.managerService.getTeamAttendance(this.startDate, this.endDate).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.attendance.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load attendance');
                this.loading.set(false);
            }
        });
    }

    onFilterChange(): void {
        if (this.dateFilter === 'today') {
            this.loadTodayAttendance();
        } else {
            this.attendance.set([]);
        }
    }

    onDateRangeSubmit(): void {
        this.loadRangeAttendance();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'ABSENT': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'HALF_DAY': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'ON_LEAVE': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'HOLIDAY': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
            case 'WEEKEND': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    formatStatus(status: string): string {
        return status?.replace(/_/g, ' ') || '';
    }

    formatTime(value: any): string {
        if (!value) return '—';
        if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
        }
        return '—';
    }

    formatHours(hours: number | null): string {
        if (hours == null) return '—';
        return hours.toFixed(1) + 'h';
    }

    getInitials(name: string): string {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    get stats() {
        const att = this.attendance();
        return {
            present: att.filter(a => a.status === 'PRESENT').length,
            absent: att.filter(a => a.status === 'ABSENT').length,
            onLeave: att.filter(a => a.status === 'ON_LEAVE').length,
            total: att.length
        };
    }
}

