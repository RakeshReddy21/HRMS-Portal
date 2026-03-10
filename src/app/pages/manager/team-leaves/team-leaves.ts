import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagerService } from '../../../services/manager.service';
import { LeaveApplication, LeaveActionRequest } from '../../../models/dashboard.model';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-team-leaves',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './team-leaves.html',
    styleUrl: './team-leaves.css',
})
export class TeamLeaves implements OnInit, OnDestroy {
    leaves = signal<LeaveApplication[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    page = signal(0);
    pageSize = 10;
    totalPages = signal(0);
    totalElements = signal(0);
    statusFilter = '';

    showActionModal = signal(false);
    selectedLeave = signal<LeaveApplication | null>(null);
    acting = signal(false);
    actionForm!: FormGroup;

    skeletonRows = Array(5).fill(0);
    private refreshSubscription: Subscription | null = null;

    constructor(
        private managerService: ManagerService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.actionForm = this.fb.group({
            action: ['APPROVED', [Validators.required]],
            comments: ['', []]
        });
        this.loadLeaves();
        
        this.refreshSubscription = interval(30000).subscribe(() => {
            if (!this.loading()) {
                this.loadLeaves();
            }
        });
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    loadLeaves(): void {
        this.loading.set(true);
        this.error.set('');
        this.managerService.getTeamLeaves(
            this.statusFilter || undefined,
            this.page(),
            this.pageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.leaves.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load team leaves');
                this.loading.set(false);
            }
        });
    }

    onStatusFilterChange(event: Event): void {
        this.statusFilter = (event.target as HTMLSelectElement).value;
        this.page.set(0);
        this.loadLeaves();
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadLeaves();
        }
    }

    openActionModal(leave: LeaveApplication): void {
        this.selectedLeave.set(leave);
        this.actionForm.patchValue({
            action: 'APPROVED',
            comments: ''
        });
        this.error.set('');
        this.showActionModal.set(true);
    }

    closeActionModal(): void {
        this.showActionModal.set(false);
        this.selectedLeave.set(null);
        this.actionForm.reset();
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

        this.managerService.actionLeave(leave.leaveId, request).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(`Leave ${action.toLowerCase()} successfully`);
                    this.closeActionModal();
                    this.loadLeaves();
                }
                this.acting.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || `Failed to ${action.toLowerCase()} leave`);
                this.acting.set(false);
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

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }

    hasError(field: string): boolean {
        const control = this.actionForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getError(field: string): string {
        const control = this.actionForm.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        return 'Invalid value';
    }

    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }
}
