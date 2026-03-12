import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import {
    EmployeeDashboardResponse,
    LeaveBalanceSummary,
    UpcomingHolidaySummary,
    AttendanceRecord,
} from '../../../models/dashboard.model';

@Component({
    selector: 'emp-dashboard',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
    userName = '';
    greeting = '';
    currentDate = '';
    currentTime = '';

    loading = signal(true);
    dashboard = signal<EmployeeDashboardResponse | null>(null);
    todayAttendance = signal<AttendanceRecord | null>(null);
    leaveBalances = signal<LeaveBalanceSummary[]>([]);
    upcomingHolidays = signal<UpcomingHolidaySummary[]>([]);
    pendingLeaves = signal(0);
    approvedLeaves = signal(0);
    liveTime = signal('');
    private clockInterval: ReturnType<typeof setInterval> | null = null;
    checkingIn = signal(false);
    checkingOut = signal(false);

    constructor(
        private authService: AuthService,
        private empService: EmployeeSelfService
    ) {}

    ngOnInit(): void {
        this.initUserInfo();
        this.updateDateTime();
        this.loadData();
        this.clockInterval = setInterval(() => this.tickClock(), 1000);
    }

    ngOnDestroy(): void {
        if (this.clockInterval) clearInterval(this.clockInterval);
    }

    private initUserInfo(): void {
        const user = this.authService.currentUser();
        this.userName = user?.name?.split(' ')[0] || 'there';
    }

    private updateDateTime(): void {
        const now = new Date();
        const hour = now.getHours();
        this.greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
        this.currentDate = now.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    private tickClock(): void {
        this.liveTime.set(
            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        );
    }

    loadData(): void {
        this.loading.set(true);
        forkJoin({
            dashboard: this.empService.getDashboard().pipe(catchError(() => of(null))),
            today: this.empService.getTodayAttendance().pipe(catchError(() => of(null)))
        }).subscribe({
            next: (res) => {
                if (res.dashboard?.success && res.dashboard.data) {
                    const d = res.dashboard.data;
                    this.dashboard.set(d);
                    this.leaveBalances.set(d.leaveBalances || []);
                    this.upcomingHolidays.set(d.upcomingHolidays || []);
                    this.pendingLeaves.set(d.pendingLeaveRequests);
                    this.approvedLeaves.set(d.approvedLeaves);
                    if (d.employeeName) {
                        this.userName = d.employeeName.split(' ')[0];
                    }
                }
                if (res.today?.success && res.today.data) {
                    this.todayAttendance.set(res.today.data);
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    doCheckIn(): void {
        this.checkingIn.set(true);
        this.empService.checkIn().subscribe({
            next: (res) => {
                if (res?.success && res.data) this.todayAttendance.set(res.data);
                this.checkingIn.set(false);
            },
            error: () => this.checkingIn.set(false)
        });
    }

    doCheckOut(): void {
        this.checkingOut.set(true);
        this.empService.checkOut().subscribe({
            next: (res) => {
                if (res?.success && res.data) this.todayAttendance.set(res.data);
                this.checkingOut.set(false);
            },
            error: () => this.checkingOut.set(false)
        });
    }

    get isCheckedIn(): boolean {
        const att = this.todayAttendance();
        return !!(att && att.checkInTime && !att.checkOutTime);
    }

    get isCompleted(): boolean {
        const att = this.todayAttendance();
        return !!(att && att.checkInTime && att.checkOutTime);
    }

    get checkInTimeStr(): string {
        const att = this.todayAttendance();
        if (!att?.checkInTime) return '--:--';
        return this.formatTimeValue(att.checkInTime);
    }

    get checkOutTimeStr(): string {
        const att = this.todayAttendance();
        if (!att?.checkOutTime) return '--:--';
        return this.formatTimeValue(att.checkOutTime);
    }

    get totalHoursStr(): string {
        const att = this.todayAttendance();
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
            return value;
        }
        if (Array.isArray(value)) {
            const h = value[3] ?? 0;
            const m = value[4] ?? 0;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
        }
        return '--:--';
    }

    getBalancePercent(b: LeaveBalanceSummary): number {
        if (!b.totalLeaves) return 0;
        return Math.round((b.usedLeaves / b.totalLeaves) * 100);
    }

    getBalanceColor(b: LeaveBalanceSummary): string {
        const pct = this.getBalancePercent(b);
        if (pct >= 80) return '#f43f5e';
        if (pct >= 60) return '#f59e0b';
        return '#10b981';
    }

    formatHolidayDate(value: any): string {
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
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    getDaysUntil(value: any): number {
        if (!value) return 0;
        let str: string;
        if (typeof value === 'string') {
            str = value.split('T')[0];
        } else if (Array.isArray(value)) {
            str = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        } else {
            return 0;
        }
        const target = new Date(str + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((target.getTime() - today.getTime()) / 86400000);
    }
}
