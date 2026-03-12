import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
import { EmployeeLeaveApplication, LeaveBalance, LeaveType, LeaveApplyRequest } from '../../../models/dashboard.model';

type TabKey = 'applications' | 'balances';

@Component({
    selector: 'app-my-leaves',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './my-leaves.html',
    styleUrl: './my-leaves.css',
})
export class MyLeaves implements OnInit {
    activeTab = signal<TabKey>('applications');
    success = signal('');
    error = signal('');
    applications = signal<EmployeeLeaveApplication[]>([]);
    appLoading = signal(true);
    appPage = signal(0);
    appTotalPages = signal(0);
    appTotalElements = signal(0);
    appPageSize = 10;
    appStatusFilter = '';
    balances = signal<LeaveBalance[]>([]);
    balancesLoading = signal(true);
    leaveTypes = signal<LeaveType[]>([]);
    showApplyModal = signal(false);
    applying = signal(false);
    applyForm!: FormGroup;
    cancelling = signal<number | null>(null);
    skeletonRows = Array(5).fill(0);
    constructor(
        private empService: EmployeeSelfService,
        private leaveService: LeaveService,
        private authService: AuthService,
        private fb: FormBuilder
    ) {}
    ngOnInit(): void {
        this.applyForm = this.fb.group({
            leaveTypeId: [null, [Validators.required]],
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
            reason: ['', [Validators.required, Validators.maxLength(500)]],
        });
        this.loadApplications();
        this.loadBalances();
    }
    switchTab(tab: TabKey): void {
        this.activeTab.set(tab);
    }
    loadApplications(): void {
        this.appLoading.set(true);
        this.empService.getMyLeaves(
            this.appStatusFilter || undefined,
            this.appPage(),
            this.appPageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.applications.set(res.data.content);
                    this.appTotalPages.set(res.data.totalPages);
                    this.appTotalElements.set(res.data.totalElements);
                }
                this.appLoading.set(false);
            },
            error: () => this.appLoading.set(false)
        });
    }
    onStatusFilterChange(event: Event): void {
        this.appStatusFilter = (event.target as HTMLSelectElement).value;
        this.appPage.set(0);
        this.loadApplications();
    }
    goToAppPage(page: number): void {
        if (page >= 0 && page < this.appTotalPages()) {
            this.appPage.set(page);
            this.loadApplications();
        }
    }
    loadBalances(): void {
        this.balancesLoading.set(true);
        this.empService.getLeaveBalance().subscribe({
            next: (res) => {
                if (res.success && res.data && res.data.length > 0) {
                    this.balances.set(res.data);
                    this.balancesLoading.set(false);
                } else {
                    this.balances.set([]);
                    this.loadLeaveTypesAsFallback();
                }
            },
            error: (err) => {
                this.balances.set([]);
                this.loadLeaveTypesAsFallback();
            }
        });
    }
    private loadLeaveTypesAsFallback(): void {
        const user = this.authService.currentUser();
        if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
            this.leaveService.getLeaveTypes().subscribe({
                next: (res) => {
                    if (res.success && res.data && res.data.length > 0) {
                        this.leaveTypes.set(res.data);
                        const fallbackBalances: LeaveBalance[] = res.data
                            .filter(lt => lt.isActive !== false)
                            .map(lt => ({
                                balanceId: 0,
                                leaveType: {
                                    leaveTypeId: lt.leaveTypeId,
                                    leaveTypeName: lt.leaveTypeName,
                                    defaultDays: lt.defaultDays || 0,
                                    isPaidLeave: lt.isPaidLeave ?? true
                                },
                                year: new Date().getFullYear(),
                                totalLeaves: lt.defaultDays || 0,
                                usedLeaves: 0,
                                availableBalance: 0
                            }));
                        this.balances.set(fallbackBalances);
                        this.balancesLoading.set(false);
                    } else {
                        this.balancesLoading.set(false);
                        if (this.showApplyModal()) {
                            this.error.set('No leave types are configured. Please contact your administrator.');
                        }
                    }
                },
                error: (err) => {
                    this.balancesLoading.set(false);
                    if (this.showApplyModal()) {
                        this.error.set('No leave quotas assigned. Please contact your administrator to assign leave quotas for available leave types.');
                    }
                }
            });
        } else {
            this.balancesLoading.set(false);
            if (this.showApplyModal()) {
                this.error.set('No leave quotas assigned. Please contact your administrator to assign leave quotas.');
            }
        }
    }
    getBalancePercent(b: LeaveBalance): number {
        if (!b.totalLeaves) return 0;
        return Math.round((b.usedLeaves / b.totalLeaves) * 100);
    }
    getBalanceColor(b: LeaveBalance): string {
        const pct = this.getBalancePercent(b);
        if (pct >= 80) return '#f43f5e';
        if (pct >= 60) return '#f59e0b';
        return '#10b981';
    }
    openApplyModal(): void {
        this.error.set('');
        this.applyForm.reset();
        Object.keys(this.applyForm.controls).forEach(key => {
            this.applyForm.get(key)?.setErrors(null);
            this.applyForm.get(key)?.markAsUntouched();
        });
        this.loadBalances();
        this.showApplyModal.set(true);
    }
    closeApplyModal(): void {
        this.showApplyModal.set(false);
        this.error.set('');
        this.applyForm.reset();
        Object.keys(this.applyForm.controls).forEach(key => {
            this.applyForm.get(key)?.setErrors(null);
            this.applyForm.get(key)?.markAsUntouched();
        });
    }
    onSubmitApply(): void {
        if (this.applyForm.invalid) {
            this.applyForm.markAllAsTouched();
            const errors: string[] = [];
            if (this.applyForm.get('leaveTypeId')?.hasError('required')) {
                errors.push('Please select a leave type');
            }
            if (this.applyForm.get('startDate')?.hasError('required')) {
                errors.push('Please select a start date');
            }
            if (this.applyForm.get('endDate')?.hasError('required')) {
                errors.push('Please select an end date');
            }
            if (this.applyForm.get('reason')?.hasError('required')) {
                errors.push('Please provide a reason');
            }
            if (this.applyForm.get('reason')?.hasError('maxlength')) {
                errors.push('Reason must be less than 500 characters');
            }
            if (errors.length > 0) {
                this.error.set(errors.join('. '));
            }
            return;
        }
        this.applying.set(true);
        this.error.set('');
        const raw = this.applyForm.getRawValue();
        if (raw.startDate && raw.endDate) {
            const startDate = new Date(raw.startDate);
            const endDate = new Date(raw.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (endDate < startDate) {
                this.error.set('End date cannot be before start date');
                this.applying.set(false);
                return;
            }
            if (startDate < today) {
                this.error.set('Cannot apply leave for past dates');
                this.applying.set(false);
                return;
            }
        }
        const request: LeaveApplyRequest = {
            leaveTypeId: raw.leaveTypeId,
            startDate: raw.startDate,
            endDate: raw.endDate,
            reason: raw.reason.trim(),
        };
        this.empService.applyLeave(request).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Leave application submitted successfully');
                    this.closeApplyModal();
                    this.loadApplications();
                    this.loadBalances();
                } else {
                    this.error.set(res.message || 'Failed to submit leave application');
                }
                this.applying.set(false);
            },
            error: (err) => {
                console.error('Leave application error:', err);
                const errorMessage = err.error?.message || err.error?.error || 'Failed to apply for leave. Please try again.';
                this.error.set(errorMessage);
                this.applying.set(false);
            }
        });
    }
    cancelLeave(app: EmployeeLeaveApplication): void {
        const msg = app.status === 'APPROVED'
            ? 'This leave is already approved. Cancelling will restore your leave balance. Proceed?'
            : 'Cancel this leave application?';
        if (!confirm(msg)) return;
        this.cancelling.set(app.leaveId);
        this.empService.cancelLeave(app.leaveId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Leave cancelled');
                    this.loadApplications();
                    this.loadBalances();
                }
                this.cancelling.set(null);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Cancel failed');
                this.cancelling.set(null);
            }
        });
    }
    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
    getStatusIcon(status: string): string {
        switch (status) {
            case 'PENDING': return '⏳';
            case 'APPROVED': return '✓';
            case 'REJECTED': return '✕';
            case 'CANCELLED': return '—';
            default: return '•';
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
    formatDateShort(value: any): string {
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
    hasError(field: string): boolean {
        const control = this.applyForm.get(field);
        return !!(control && control.invalid && control.touched);
    }
    getError(field: string): string {
        const control = this.applyForm.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['maxlength']) return `Max ${control.errors['maxlength'].requiredLength} characters`;
        return 'Invalid value';
    }
    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }
}
