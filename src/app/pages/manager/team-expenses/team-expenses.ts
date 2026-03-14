import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseActionRequest } from '../../../models/expense.model';

@Component({
    selector: 'app-team-expenses',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './team-expenses.html',
    styleUrl: './team-expenses.css',
})
export class TeamExpenses implements OnInit {
    expenses = signal<Expense[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    page = signal(0);
    pageSize = 10;
    totalPages = signal(0);
    totalElements = signal(0);

    showDetailModal = signal(false);
    selectedExpense = signal<Expense | null>(null);
    acting = signal(false);
    actionForm!: FormGroup;

    skeletonRows = Array(5).fill(0);

    constructor(
        private expenseService: ExpenseService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.actionForm = this.fb.group({
            action: ['APPROVED', [Validators.required]],
            comments: ['']
        });
        this.loadExpenses();
    }

    loadExpenses(): void {
        this.loading.set(true);
        this.error.set('');
        this.expenseService.getTeamExpenses(this.page(), this.pageSize).subscribe({
            next: (res) => {
                this.expenses.set(res.content);
                this.totalPages.set(res.totalPages);
                this.totalElements.set(res.totalElements);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load team expenses');
                this.loading.set(false);
            }
        });
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadExpenses();
        }
    }

    openDetail(expense: Expense): void {
        this.selectedExpense.set(expense);
        this.actionForm.patchValue({ action: 'APPROVED', comments: '' });
        this.error.set('');
        this.showDetailModal.set(true);
    }

    closeDetail(): void {
        this.showDetailModal.set(false);
        this.selectedExpense.set(null);
        this.actionForm.reset({ action: 'APPROVED', comments: '' });
    }

    submitAction(): void {
        if (this.actionForm.invalid) return;
        const expense = this.selectedExpense();
        if (!expense) return;

        const { action, comments } = this.actionForm.getRawValue();

        if (action === 'REJECTED' && !comments?.trim()) {
            this.error.set('Comments are required when rejecting');
            return;
        }

        this.acting.set(true);
        this.error.set('');

        const request: ExpenseActionRequest = { action, comments: comments?.trim() || undefined };

        this.expenseService.managerAction(expense.expenseId, request).subscribe({
            next: () => {
                this.showToast(`Expense ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
                this.closeDetail();
                this.loadExpenses();
                this.acting.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Action failed');
                this.acting.set(false);
            }
        });
    }

    // ─── Helpers ───
    getStatusColor(s: string): string {
        const c: Record<string, string> = {
            DRAFT: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
            SUBMITTED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            MANAGER_APPROVED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            FINANCE_APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
            REIMBURSED: 'bg-green-500/10 text-green-400 border border-green-500/20'
        };
        return c[s] || 'bg-slate-500/10 text-slate-400';
    }

    formatCategory(cat: string): string { return cat?.replace(/_/g, ' ') || ''; }
    formatStatus(s: string): string { return s?.replace(/_/g, ' ') || ''; }

    formatDate(value: any): string {
        if (!value) return '';
        let str: string;
        if (typeof value === 'string') str = value.split('T')[0];
        else if (Array.isArray(value)) str = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        else return '';
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }

    private showToast(msg: string): void {
        this.success.set(msg);
        setTimeout(() => this.success.set(''), 3000);
    }
}

