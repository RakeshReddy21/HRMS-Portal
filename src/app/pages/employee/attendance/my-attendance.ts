import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, catchError } from 'rxjs';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { AttendanceRecord, AttendanceSummary } from '../../../models/dashboard.model';

@Component({
    selector: 'app-my-attendance',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-attendance.html',
    styleUrl: './my-attendance.css',
})
export class MyAttendance implements OnInit {
    records = signal<AttendanceRecord[]>([]);
    loading = signal(true);
    error = signal('');
    page = signal(0);
    totalPages = signal(0);
    totalElements = signal(0);
    pageSize = 10;
    summary = signal<AttendanceSummary | null>(null);
    summaryLoading = signal(true);
    summaryMonth = signal(new Date().getMonth() + 1);
    summaryYear = signal(new Date().getFullYear());
    todayRecord = signal<AttendanceRecord | null>(null);
    checkingIn = signal(false);
    checkingOut = signal(false);
    skeletonRows = Array(6).fill(0);

    constructor(private empService: EmployeeSelfService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.loading.set(true);
        this.summaryLoading.set(true);
        forkJoin({
            today: this.empService.getTodayAttendance().pipe(catchError(() => of(null))),
            history: this.empService.getAttendanceHistory(undefined, undefined, this.page(), this.pageSize).pipe(catchError(() => of(null))),
            summary: this.empService.getAttendanceSummary(this.summaryMonth(), this.summaryYear()).pipe(catchError(() => of(null))),
        }).subscribe({
            next: (res) => {
                if (res.today?.success && res.today.data) {
                    this.todayRecord.set(res.today.data);
                }
                if (res.history?.success && res.history.data) {
                    this.records.set(res.history.data.content);
                    this.totalPages.set(res.history.data.totalPages);
                    this.totalElements.set(res.history.data.totalElements);
                }
                if (res.summary?.success && res.summary.data) {
                    this.summary.set(res.summary.data);
                }
                this.loading.set(false);
                this.summaryLoading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.summaryLoading.set(false);
            }
        });
    }

    loadHistory(): void {
        this.loading.set(true);
        this.empService.getAttendanceHistory(undefined, undefined, this.page(), this.pageSize)
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.records.set(res.data.content);
                        this.totalPages.set(res.data.totalPages);
                        this.totalElements.set(res.data.totalElements);
                    }
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    loadSummary(): void {
        this.summaryLoading.set(true);
        this.empService.getAttendanceSummary(this.summaryMonth(), this.summaryYear())
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) this.summary.set(res.data);
                    this.summaryLoading.set(false);
                },
                error: () => this.summaryLoading.set(false)
            });
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadHistory();
        }
    }

    changeSummaryMonth(delta: number): void {
        let m = this.summaryMonth() + delta;
        let y = this.summaryYear();
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        this.summaryMonth.set(m);
        this.summaryYear.set(y);
        this.loadSummary();
    }

    doCheckIn(): void {
        this.checkingIn.set(true);
        this.error.set('');
        this.empService.checkIn().subscribe({
            next: (res) => {
                if (res?.success && res.data) {
                    this.todayRecord.set(res.data);
                    this.loadHistory();
                }
                this.checkingIn.set(false);
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Check-in failed');
                this.checkingIn.set(false);
            }
        });
    }

    doCheckOut(): void {
        this.checkingOut.set(true);
        this.error.set('');
        this.empService.checkOut().subscribe({
            next: (res) => {
                if (res?.success && res.data) {
                    this.todayRecord.set(res.data);
                    this.loadHistory();
                }
                this.checkingOut.set(false);
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Check-out failed');
                this.checkingOut.set(false);
            }
        });
    }

    get isCheckedIn(): boolean {
        const att = this.todayRecord();
        return !!(att && att.checkInTime && !att.checkOutTime);
    }

    get isCompleted(): boolean {
        const att = this.todayRecord();
        return !!(att && att.checkInTime && att.checkOutTime);
    }

    get checkInTimeStr(): string {
        const att = this.todayRecord();
        if (!att?.checkInTime) return '--:--';
        return this.formatTimeValue(att.checkInTime);
    }

    get checkOutTimeStr(): string {
        const att = this.todayRecord();
        if (!att?.checkOutTime) return '--:--';
        return this.formatTimeValue(att.checkOutTime);
    }

    get totalHoursStr(): string {
        const att = this.todayRecord();
        if (!att?.totalHours) return '0h 0m';
        const h = Math.floor(att.totalHours);
        const m = Math.round((att.totalHours - h) * 60);
        return `${h}h ${m}m`;
    }

    formatTimeValue(value: any): string {
        if (!value) return '--:--';
        if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            const parts = value.split(':');
            if (parts.length >= 2) {
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const period = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
            }
            return value;
        }
        if (Array.isArray(value)) {
            const h = value[3] ?? value[0] ?? 0;
            const m = value[4] ?? value[1] ?? 0;
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
        }
        return '--:--';
    }

    formatDateDisplay(dateStr: string): string {
        if (!dateStr) return '';
        try {
            if (Array.isArray(dateStr)) {
                const arr = dateStr as unknown as number[];
                const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1);
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    formatHours(hours: number | null): string {
        if (hours == null) return '—';
        return hours.toFixed(1) + 'h';
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

    getMonthName(m: number): string {
        return new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' });
    }
}
