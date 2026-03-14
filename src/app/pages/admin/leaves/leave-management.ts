import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService } from '../../../services/leave.service';
import { ExpenseService } from '../../../services/expense.service';
import { Holiday, LeaveActionRequest, LeaveApplication, LeaveType, LeaveTypeRequest, HolidayRequest } from '../../../models/dashboard.model';
import { LeaveAnalysisResponse } from '../../../models/expense.model';
import { PageResponse } from '../../../models/employee.model';
import { KeyValuePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';

type TabKey = 'applications' | 'types' | 'holidays';

@Component({
    selector: 'app-leave-management',
    standalone: true,
    imports: [ReactiveFormsModule, KeyValuePipe],
    templateUrl: './leave-management.html',
    styleUrl: './leave-management.css',
})
export class LeaveManagement implements OnInit, OnDestroy {
    activeTab = signal<TabKey>('applications');
    success = signal('');
    error = signal('');
    applications = signal<LeaveApplication[]>([]);
    appLoading = signal(true);
    appPage = signal(0);
    appTotalPages = signal(0);
    appTotalElements = signal(0);
    appPageSize = 10;
    appStatusFilter = '';
    showActionModal = signal(false);
    selectedLeave = signal<LeaveApplication | null>(null);
    acting = signal(false);
    actionForm!: FormGroup;
    leaveTypes = signal<LeaveType[]>([]);
    typesLoading = signal(true);
    showTypeModal = signal(false);
    editingType = signal<LeaveType | null>(null);
    savingType = signal(false);
    typeForm!: FormGroup;
    holidays = signal<Holiday[]>([]);
    holidaysLoading = signal(true);
    showHolidayModal = signal(false);
    editingHoliday = signal<Holiday | null>(null);
    savingHoliday = signal(false);
    holidayForm!: FormGroup;
    holidayYear = signal(new Date().getFullYear());

    // AI Analysis
    analyzing = signal(false);
    analysisResult = signal<LeaveAnalysisResponse | null>(null);
    analysisError = signal('');
    showAnalysis = signal(false);

    skeletonRows = Array(5).fill(0);
    private refreshSubscription: Subscription | null = null;

    constructor(
        private leaveService: LeaveService,
        private expenseService: ExpenseService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.initForms();
        this.loadApplications();
        this.loadLeaveTypes();
        this.loadHolidays();
        this.refreshSubscription = interval(30000).subscribe(() => {
            if (this.activeTab() === 'applications' && !this.appLoading()) {
                this.loadApplications();
            }
        });
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    private initForms(): void {
        this.actionForm = this.fb.group({
            action: ['APPROVED', [Validators.required]],
            comments: ['', []]
        });

        this.typeForm = this.fb.group({
            leaveTypeName: ['', [Validators.required, Validators.maxLength(100)]],
            description: [''],
            defaultDays: [0, [Validators.required, Validators.min(0)]],
            isPaidLeave: [true],
            isCarryForwardEnabled: [false],
            maxCarryForwardDays: [0],
            isLossOfPay: [false],
        });

        this.holidayForm = this.fb.group({
            holidayName: ['', [Validators.required, Validators.maxLength(100)]],
            holidayDate: ['', [Validators.required]],
            description: [''],
        });
    }

    switchTab(tab: TabKey): void {
        this.activeTab.set(tab);
    }

    loadApplications(): void {
        this.appLoading.set(true);
        this.leaveService.getApplications(
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

    onAppStatusChange(event: Event): void {
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

    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    parseDateStr(value: any): string {
        if (typeof value === 'string') return value.split('T')[0];
        if (Array.isArray(value)) {
            return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        }
        return '';
    }

    formatDate(value: any): string {
        const str = this.parseDateStr(value);
        if (!str) return '';
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    openActionModal(app: LeaveApplication): void {
        this.selectedLeave.set(app);
        this.actionForm.patchValue({ action: 'APPROVED', comments: '' });
        this.error.set('');
        this.showActionModal.set(true);
    }

    closeActionModal(): void {
        this.showActionModal.set(false);
        this.selectedLeave.set(null);
        this.actionForm.reset();
        this.analysisResult.set(null);
        this.showAnalysis.set(false);
        this.analysisError.set('');
    }

    runAnalysis(): void {
        const leave = this.selectedLeave();
        if (!leave) return;
        this.analyzing.set(true);
        this.analysisError.set('');
        this.expenseService.analyzeLeave(leave.leaveId).subscribe({
            next: (res) => {
                this.analysisResult.set(res);
                this.showAnalysis.set(true);
                this.analyzing.set(false);
            },
            error: (err) => {
                this.analysisError.set(err.error?.message || 'AI analysis failed. Please try again.');
                this.analyzing.set(false);
            }
        });
    }

    submitAction(): void {
        if (this.actionForm.invalid) {
            this.actionForm.markAllAsTouched();
            return;
        }
        const leave = this.selectedLeave();
        if (!leave) return;

        const formValue = this.actionForm.getRawValue();
        const action = formValue.action;

        if (action === 'REJECTED' && !formValue.comments?.trim()) {
            this.error.set('Comments are required when rejecting a leave');
            return;
        }

        this.acting.set(true);
        this.error.set('');

        const request: LeaveActionRequest = {
            action: action,
            comments: formValue.comments?.trim() || undefined
        };

        this.leaveService.actionLeave(leave.leaveId, request).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(`Leave ${action.toLowerCase()} successfully`);
                    this.closeActionModal();
                    this.loadApplications();
                }
                this.acting.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || `Failed to ${action.toLowerCase()} leave`);
                this.acting.set(false);
            }
        });
    }

    loadLeaveTypes(): void {
        this.typesLoading.set(true);
        this.leaveService.getLeaveTypes().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.leaveTypes.set(res.data);
                }
                this.typesLoading.set(false);
            },
            error: () => this.typesLoading.set(false)
        });
    }

    openCreateType(): void {
        this.editingType.set(null);
        this.typeForm.reset({ defaultDays: 0, isPaidLeave: true, isCarryForwardEnabled: false, maxCarryForwardDays: 0, isLossOfPay: false });
        this.showTypeModal.set(true);
    }

    openEditType(lt: LeaveType): void {
        this.editingType.set(lt);
        this.typeForm.patchValue({
            leaveTypeName: lt.leaveTypeName,
            description: lt.description || '',
            defaultDays: lt.defaultDays,
            isPaidLeave: lt.isPaidLeave,
            isCarryForwardEnabled: lt.isCarryForwardEnabled,
            maxCarryForwardDays: lt.maxCarryForwardDays,
            isLossOfPay: lt.isLossOfPay,
        });
        this.showTypeModal.set(true);
    }

    closeTypeModal(): void {
        this.showTypeModal.set(false);
        this.editingType.set(null);
        this.typeForm.reset();
    }

    onSubmitType(): void {
        if (this.typeForm.invalid) {
            this.typeForm.markAllAsTouched();
            return;
        }
        this.savingType.set(true);
        this.error.set('');
        const raw = this.typeForm.getRawValue();
        const request: LeaveTypeRequest = {
            leaveTypeName: raw.leaveTypeName,
            description: raw.description || undefined,
            defaultDays: raw.defaultDays,
            isPaidLeave: raw.isPaidLeave,
            isCarryForwardEnabled: raw.isCarryForwardEnabled,
            maxCarryForwardDays: raw.maxCarryForwardDays,
            isLossOfPay: raw.isLossOfPay,
        };
        const edit = this.editingType();
        const action$ = edit
            ? this.leaveService.updateLeaveType(edit.leaveTypeId, request)
            : this.leaveService.createLeaveType(request);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(edit ? 'Leave type updated' : 'Leave type created');
                    this.closeTypeModal();
                    this.loadLeaveTypes();
                }
                this.savingType.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Operation failed');
                this.savingType.set(false);
            }
        });
    }

    loadHolidays(): void {
        this.holidaysLoading.set(true);
        this.leaveService.getHolidays(this.holidayYear()).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.holidays.set(res.data);
                }
                this.holidaysLoading.set(false);
            },
            error: () => this.holidaysLoading.set(false)
        });
    }

    changeHolidayYear(delta: number): void {
        this.holidayYear.set(this.holidayYear() + delta);
        this.loadHolidays();
    }

    openCreateHoliday(): void {
        this.editingHoliday.set(null);
        this.holidayForm.reset();
        this.showHolidayModal.set(true);
    }

    openEditHoliday(h: Holiday): void {
        this.editingHoliday.set(h);
        this.holidayForm.patchValue({
            holidayName: h.holidayName,
            holidayDate: this.parseDateStr(h.holidayDate),
            description: h.description || '',
        });
        this.showHolidayModal.set(true);
    }

    closeHolidayModal(): void {
        this.showHolidayModal.set(false);
        this.editingHoliday.set(null);
        this.holidayForm.reset();
    }

    onSubmitHoliday(): void {
        if (this.holidayForm.invalid) {
            this.holidayForm.markAllAsTouched();
            return;
        }
        this.savingHoliday.set(true);
        this.error.set('');
        const raw = this.holidayForm.getRawValue();
        const request: HolidayRequest = {
            holidayName: raw.holidayName,
            holidayDate: raw.holidayDate,
            description: raw.description || undefined,
        };
        const edit = this.editingHoliday();
        const action$ = edit
            ? this.leaveService.updateHoliday(edit.holidayId, request)
            : this.leaveService.createHoliday(request);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(edit ? 'Holiday updated' : 'Holiday created');
                    this.closeHolidayModal();
                    this.loadHolidays();
                }
                this.savingHoliday.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Operation failed');
                this.savingHoliday.set(false);
            }
        });
    }

    deleteHoliday(h: Holiday): void {
        if (!confirm(`Delete holiday "${h.holidayName}"?`)) return;
        this.leaveService.deleteHoliday(h.holidayId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Holiday deleted');
                    this.loadHolidays();
                }
            },
            error: (err) => this.error.set(err.error?.message || 'Delete failed')
        });
    }

    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }

    hasError(form: FormGroup, field: string): boolean {
        const control = form.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getError(form: FormGroup, field: string): string {
        const control = form.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['maxlength']) return `Max ${control.errors['maxlength'].requiredLength} characters`;
        if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
        return 'Invalid value';
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }
}

