import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { ManagerService } from '../../../services/manager.service';
import {
    EmployeeDashboardResponse,
    TeamCount,
    LeaveApplication,
    AttendanceRecord,
} from '../../../models/dashboard.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
    userName = '';
    greeting = '';
    currentDate = '';
    currentTime = '';

    loading = signal(true);
    personalDashboard = signal<EmployeeDashboardResponse | null>(null);
    teamCount = signal<TeamCount | null>(null);
    pendingTeamLeaves = signal<LeaveApplication[]>([]);
    pendingTeamLeavesCount = signal(0);
    teamAttendanceToday = signal<AttendanceRecord[]>([]);
    presentToday = signal(0);
    absentToday = signal(0);

    skeletonCards = [1, 2, 3, 4];

    constructor(
        private authService: AuthService,
        private empService: EmployeeSelfService,
        private managerService: ManagerService
    ) {}

    ngOnInit(): void {
        this.initUserInfo();
        this.updateDateTime();
        this.loadDashboardData();
    }

    private initUserInfo(): void {
        const user = this.authService.currentUser();
        this.userName = user?.name?.split(' ')[0] || 'Manager';
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
        forkJoin({
            personal: this.empService.getDashboard().pipe(catchError(() => of(null))),
            teamCount: this.managerService.getTeamCount().pipe(catchError(() => of(null))),
            pendingLeaves: this.managerService.getTeamLeaves('PENDING', 0, 10).pipe(catchError(() => of(null))),
            attendanceToday: this.managerService.getTeamAttendanceToday().pipe(catchError(() => of(null))),
        }).subscribe({
            next: (res) => {
                if (res.personal?.success && res.personal.data) {
                    this.personalDashboard.set(res.personal.data);
                    if (res.personal.data.employeeName) {
                        this.userName = res.personal.data.employeeName.split(' ')[0];
                    }
                }
                if (res.teamCount?.success && res.teamCount.data) {
                    this.teamCount.set(res.teamCount.data);
                }
                if (res.pendingLeaves?.success && res.pendingLeaves.data) {
                    this.pendingTeamLeaves.set(res.pendingLeaves.data.content);
                    this.pendingTeamLeavesCount.set(res.pendingLeaves.data.totalElements);
                }
                if (res.attendanceToday?.success && res.attendanceToday.data) {
                    this.teamAttendanceToday.set(res.attendanceToday.data);
                    this.presentToday.set(res.attendanceToday.data.filter(a => a.status === 'PRESENT').length);
                    this.absentToday.set(res.attendanceToday.data.filter(a => a.status === 'ABSENT').length);
                }

                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'ABSENT': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'HALF_DAY': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'ON_LEAVE': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    formatStatus(status: string): string {
        return status?.replace(/_/g, ' ') || '';
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }
}
