import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { DashboardResponse, Holiday, Announcement, LeaveApplication } from '../../../models/dashboard.model';

interface DeptSlice {
    name: string;
    count: number;
    percentage: number;
    color: string;
    dashArray: string;
    dashOffset: number;
}

interface CalendarDay {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isHoliday: boolean;
    holidayName?: string;
    isWeekend: boolean;
}

@Component({
    selector: 'app-dashboard',
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
    stats = signal<DashboardResponse | null>(null);
    departmentSlices = signal<DeptSlice[]>([]);
    donutTotal = signal(0);
    workforceSlices = signal<DeptSlice[]>([]);
    workforceTotal = signal(0);
    pendingLeaves = signal<LeaveApplication[]>([]);
    pendingLeaveCount = signal(0);
    onLeaveToday = signal<LeaveApplication[]>([]);
    holidays = signal<Holiday[]>([]);
    upcomingHolidays = signal<Holiday[]>([]);
    announcements = signal<Announcement[]>([]);
    calendarDays = signal<CalendarDay[]>([]);
    calendarMonth = '';
    calendarYear = 0;

    weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    skeletonCards = [1, 2, 3, 4];

    private timeInterval: ReturnType<typeof setInterval> | null = null;

    private readonly donutColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#6366f1', '#14b8a6', ];

    constructor(
        private authService: AuthService,
        private dashboardService: DashboardService
    ) {}

    ngOnInit(): void {
        this.initUserInfo();
        this.updateDateTime();
        this.loadDashboardData();
        this.timeInterval = setInterval(() => this.updateDateTime(), 60000);
    }

    ngOnDestroy(): void {
        if (this.timeInterval) clearInterval(this.timeInterval);
    }

    private initUserInfo(): void {
        const user = this.authService.currentUser();
        this.userName = user?.name?.split(' ')[0] || 'Admin';
    }

    private updateDateTime(): void {
        const now = new Date();
        const hour = now.getHours();
        this.greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
        this.currentDate = now.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
        });
        this.currentTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    loadDashboardData(): void {
        this.loading.set(true);
        const year = new Date().getFullYear();

        forkJoin({
            dashboard: this.dashboardService.getDashboardStats().pipe(catchError(() => of(null))),
            pendingLeaves: this.dashboardService.getPendingLeaves(0, 5).pipe(catchError(() => of(null))),
            approvedLeaves: this.dashboardService.getApprovedLeaves(0, 100).pipe(catchError(() => of(null))),
            holidays: this.dashboardService.getHolidays(year).pipe(catchError(() => of(null))),
            announcements: this.dashboardService.getAnnouncements(0, 5).pipe(catchError(() => of(null)))
        }).subscribe({
            next: (res) => {
                if (res.dashboard?.success && res.dashboard.data) {
                    this.stats.set(res.dashboard.data);
                    this.processDepartmentSlices(res.dashboard.data.employeesByDepartment);
                    this.processWorkforceSlices(res.dashboard.data);
                }

                if (res.pendingLeaves?.success && res.pendingLeaves.data) {
                    this.pendingLeaves.set(res.pendingLeaves.data.content);
                    this.pendingLeaveCount.set(res.pendingLeaves.data.totalElements);
                }

                if (res.approvedLeaves?.success && res.approvedLeaves.data) {
                    const today = this.getTodayStr();
                    this.onLeaveToday.set(
                        res.approvedLeaves.data.content.filter(l =>
                            this.parseDateStr(l.startDate) <= today && this.parseDateStr(l.endDate) >= today
                        )
                    );
                }
                if (res.holidays?.success && res.holidays.data) {
                    this.holidays.set(res.holidays.data);
                    const today = this.getTodayStr();
                    this.upcomingHolidays.set(
                        res.holidays.data
                            .filter(h => this.parseDateStr(h.holidayDate) >= today)
                            .sort((a, b) => this.parseDateStr(a.holidayDate).localeCompare(this.parseDateStr(b.holidayDate)))
                            .slice(0, 5)
                    );
                    this.generateCalendar(res.holidays.data);
                } else {
                    this.generateCalendar([]);
                }

                if (res.announcements?.success && res.announcements.data) {
                    this.announcements.set(res.announcements.data.content);
                }

                this.loading.set(false);
            },
            error: () => {
                this.generateCalendar([]);
                this.loading.set(false);
            }
        });
    }
    private getTodayStr(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    parseDateStr(value: any): string {
        if (typeof value === 'string') return value.split('T')[0];
        if (Array.isArray(value)) {
            return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        }
        return '';
    }

    private processDepartmentSlices(deptMap: Record<string, number>): void {
        if (!deptMap) { this.departmentSlices.set([]); this.donutTotal.set(0); return; }
        const entries = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((s, [, c]) => s + c, 0);
        if (!total) { this.departmentSlices.set([]); this.donutTotal.set(0); return; }

        const CIRCUMFERENCE = 2 * Math.PI * 80;
        const GAP = entries.length > 1 ? 4 : 0;
        let cumulative = 0;

        this.departmentSlices.set(
            entries.map(([name, count], i) => {
                const pct = (count / total) * 100;
                const arcLen = (count / total) * CIRCUMFERENCE;
                const visible = Math.max(arcLen - GAP, 0);
                const slice: DeptSlice = {
                    name, count,
                    percentage: Math.round(pct),
                    color: this.donutColors[i % this.donutColors.length],
                    dashArray: `${visible} ${CIRCUMFERENCE - visible}`,
                    dashOffset: -cumulative
                };
                cumulative += arcLen;
                return slice;
            })
        );
        this.donutTotal.set(total);
    }

    private processWorkforceSlices(data: DashboardResponse): void {
        const entries: [string, number, string][] = [
            ['Active Admins', data.totalAdmins, '#8b5cf6'],
            ['Active Managers', data.totalManagers, '#3b82f6'],
            ['Active Employees', data.totalRegularEmployees, '#10b981'],
            ['Inactive', data.inactiveEmployees, '#f43f5e'],
        ].filter(([, c]) => (c as number) > 0) as [string, number, string][];

        const total = entries.reduce((s, [, c]) => s + c, 0);
        if (!total) { this.workforceSlices.set([]); this.workforceTotal.set(0); return; }

        const CIRCUMFERENCE = 2 * Math.PI * 80;
        const GAP = entries.length > 1 ? 4 : 0;
        let cumulative = 0;

        this.workforceSlices.set(
            entries.map(([name, count, color]) => {
                const pct = (count / total) * 100;
                const arcLen = (count / total) * CIRCUMFERENCE;
                const visible = Math.max(arcLen - GAP, 0);
                const slice: DeptSlice = {
                    name, count,
                    percentage: Math.round(pct),
                    color,
                    dashArray: `${visible} ${CIRCUMFERENCE - visible}`,
                    dashOffset: -cumulative
                };
                cumulative += arcLen;
                return slice;
            })
        );
        this.workforceTotal.set(total);
    }

    private generateCalendar(holidays: Holiday[]): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        this.calendarMonth = now.toLocaleString('default', { month: 'long' });
        this.calendarYear = year;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = now.getDate();

        const holidayMap = new Map<number, string>();
        holidays.forEach(h => {
            const dateStr = this.parseDateStr(h.holidayDate);
            const parts = dateStr.split('-');
            if (parseInt(parts[1]) === month + 1 && parseInt(parts[0]) === year) {
                holidayMap.set(parseInt(parts[2]), h.holidayName);
            }
        });

        const days: CalendarDay[] = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isToday: false, isHoliday: false, isWeekend: false });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(year, month, d).getDay();
            days.push({
                day: d,
                isCurrentMonth: true,
                isToday: d === today,
                isHoliday: holidayMap.has(d),
                holidayName: holidayMap.get(d),
                isWeekend: dow === 0 || dow === 6
            });
        }
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({ day: d, isCurrentMonth: false, isToday: false, isHoliday: false, isWeekend: false });
        }

        this.calendarDays.set(days);
    }

    getCalendarDayClass(day: CalendarDay): string {
        let classes = 'relative text-center py-3 text-[13px] transition-colors duration-150 cursor-default group ';
        if (!day.isCurrentMonth) {
            classes += 'bg-slate-950/50 text-slate-700 ';
        } else if (day.isToday) {
            classes += 'bg-slate-900/80 text-white font-bold ';
        } else if (day.isHoliday) {
            classes += 'bg-red-500/15 text-red-300 font-semibold hover:bg-red-500/25 ';
        } else if (day.isWeekend) {
            classes += 'bg-slate-900/80 text-slate-600 hover:bg-white/[0.04] ';
        } else {
            classes += 'bg-slate-900/80 text-slate-400 hover:bg-white/[0.04] ';
        }
        return classes;
    }

    formatDate(value: any): string {
        const str = this.parseDateStr(value);
        if (!str) return '';
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatHolidayDate(value: any): string {
        const str = this.parseDateStr(value);
        if (!str) return '';
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    getTimeAgo(value: any): string {
        let date: Date;
        if (typeof value === 'string') {
            date = new Date(value);
        } else if (Array.isArray(value)) {
            date = new Date(value[0], (value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0);
        } else {
            return '';
        }
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(hours / 24);
        if (days > 30) return `${Math.floor(days / 30)}mo ago`;
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    }

    getDaysUntil(value: any): number {
        const str = this.parseDateStr(value);
        if (!str) return 0;
        const target = new Date(str + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((target.getTime() - today.getTime()) / 86400000);
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }
}
