import { Component, OnInit, signal } from '@angular/core';
import { AttendanceService } from '../../../services/attendance.service';
import { AttendanceRecord, AttendanceSummary } from '../../../models/dashboard.model';

@Component({
    selector: 'app-attendance-management',
    standalone: true,
    imports: [],
    templateUrl: './attendance-management.html',
    styleUrl: './attendance-management.css',
})
export class AttendanceManagement implements OnInit {
    records = signal<AttendanceRecord[]>([]);
    loading = signal(true);
    error = signal('');

    page = signal(0);
    totalPages = signal(0);
    totalElements = signal(0);
    pageSize = 20;

    selectedDate = signal(this.todayStr());

    showSummary = signal(false);
    summaryLoading = signal(false);
    summary = signal<AttendanceSummary | null>(null);
    summaryMonth = signal(new Date().getMonth() + 1);
    summaryYear = signal(new Date().getFullYear());
    selectedEmployee = signal<AttendanceRecord | null>(null);

    skeletonRows = Array(8).fill(0);

    constructor(private attendanceService: AttendanceService) {}

    ngOnInit(): void {
        this.loadRecords();
    }

    loadRecords(): void {
        this.loading.set(true);
        this.error.set('');
        this.attendanceService
            .getAll(this.selectedDate(), this.page(), this.pageSize)
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.records.set(res.data.content);
                        this.totalPages.set(res.data.totalPages);
                        this.totalElements.set(res.data.totalElements);
                    }
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(err.error?.message || 'Failed to load attendance');
                    this.loading.set(false);
                },
            });
    }

    onDateChange(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.selectedDate.set(val);
        this.page.set(0);
        this.loadRecords();
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadRecords();
        }
    }

    goToday(): void {
        this.selectedDate.set(this.todayStr());
        this.page.set(0);
        this.loadRecords();
    }

    openSummary(rec: AttendanceRecord): void {
        this.selectedEmployee.set(rec);
        this.summaryMonth.set(new Date().getMonth() + 1);
        this.summaryYear.set(new Date().getFullYear());
        this.showSummary.set(true);
        this.loadSummary(rec.employeeCode);
    }

    closeSummary(): void {
        this.showSummary.set(false);
        this.selectedEmployee.set(null);
        this.summary.set(null);
    }

    changeSummaryMonth(delta: number): void {
        let m = this.summaryMonth() + delta;
        let y = this.summaryYear();
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        this.summaryMonth.set(m);
        this.summaryYear.set(y);
        const emp = this.selectedEmployee();
        if (emp) this.loadSummary(emp.employeeCode);
    }

    private loadSummary(employeeCode: string): void {
        this.summaryLoading.set(true);
        this.attendanceService
            .getEmployeeSummary(employeeCode, this.summaryMonth(), this.summaryYear())
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.summary.set(res.data);
                    }
                    this.summaryLoading.set(false);
                },
                error: () => this.summaryLoading.set(false),
            });
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

    getStatusDot(status: string): string {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-400';
            case 'ABSENT': return 'bg-red-400';
            case 'HALF_DAY': return 'bg-amber-400';
            case 'ON_LEAVE': return 'bg-blue-400';
            case 'HOLIDAY': return 'bg-violet-400';
            case 'WEEKEND': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    }

    formatStatus(status: string): string {
        return status.replace(/_/g, ' ');
    }

    formatTime(datetime: string | null): string {
        if (!datetime) return '—';
        try {
            if (Array.isArray(datetime)) {
                const arr = datetime as unknown as number[];
                const h = arr[3] ?? 0;
                const m = arr[4] ?? 0;
                const period = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return `${h12}:${String(m).padStart(2, '0')} ${period}`;
            }
            
            const date = new Date(datetime);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '—';
        }
    }

    formatHours(hours: number | null): string {
        if (hours == null) return '—';
        return hours.toFixed(1) + 'h';
    }

    formatDateDisplay(dateStr: string): string {
        if (!dateStr) return '';
        try {
            if (Array.isArray(dateStr)) {
                const arr = dateStr as unknown as number[];
                const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1);
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            }
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
    }

    getMonthName(m: number): string {
        return new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' });
    }

    private todayStr(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    get presentCount(): number {
        return this.records().filter(r => r.status === 'PRESENT').length;
    }

    get absentCount(): number {
        return this.records().filter(r => r.status === 'ABSENT').length;
    }

    get lateCount(): number {
        return this.records().filter(r => r.isLate).length;
    }

    get onLeaveCount(): number {
        return this.records().filter(r => r.status === 'ON_LEAVE').length;
    }
}

