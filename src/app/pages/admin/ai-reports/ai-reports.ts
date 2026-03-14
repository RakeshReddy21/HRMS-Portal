import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../../services/expense.service';
import { EmployeeService } from '../../../services/employee.service';
import { PerformanceReportResponse } from '../../../models/expense.model';
import { EmployeeProfile } from '../../../models/employee.model';

@Component({
    selector: 'app-ai-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-reports.html',
    styleUrl: './ai-reports.css',
})
export class AiReports implements OnInit {
    // Employee search
    employees = signal<EmployeeProfile[]>([]);
    loadingEmployees = signal(false);
    searchKeyword = '';
    selectedEmployee = signal<EmployeeProfile | null>(null);

    // Report
    report = signal<PerformanceReportResponse | null>(null);
    generating = signal(false);
    error = signal('');
    period = '';

    constructor(
        private expenseService: ExpenseService,
        private employeeService: EmployeeService
    ) {}

    ngOnInit(): void {
        this.loadEmployees();
    }

    loadEmployees(): void {
        this.loadingEmployees.set(true);
        this.employeeService.getEmployees(
            this.searchKeyword || undefined,
            undefined, undefined, true, 0, 100
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.employees.set(res.data.content);
                }
                this.loadingEmployees.set(false);
            },
            error: () => this.loadingEmployees.set(false)
        });
    }

    onSearch(): void {
        this.loadEmployees();
    }

    selectEmployee(emp: EmployeeProfile): void {
        this.selectedEmployee.set(emp);
        this.report.set(null);
        this.error.set('');
    }

    clearSelection(): void {
        this.selectedEmployee.set(null);
        this.report.set(null);
        this.error.set('');
        this.period = '';
    }

    generateReport(): void {
        const emp = this.selectedEmployee();
        if (!emp) return;

        this.generating.set(true);
        this.error.set('');
        this.report.set(null);

        this.expenseService.generateReport(emp.employeeId, this.period || undefined).subscribe({
            next: (res) => {
                this.report.set(res);
                this.generating.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to generate report. Please try again.');
                this.generating.set(false);
            }
        });
    }

    getRatingColor(rating: string): string {
        switch (rating) {
            case 'EXCEPTIONAL': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25';
            case 'EXCEEDS_EXPECTATIONS': return 'text-blue-400 bg-blue-500/15 border-blue-500/25';
            case 'MEETS_EXPECTATIONS': return 'text-amber-400 bg-amber-500/15 border-amber-500/25';
            case 'NEEDS_IMPROVEMENT': return 'text-red-400 bg-red-500/15 border-red-500/25';
            default: return 'text-slate-400 bg-slate-500/15 border-slate-500/25';
        }
    }

    formatRating(rating: string): string {
        return rating?.replace(/_/g, ' ') || '';
    }

    getGoalStatusColor(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400';
            case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-400';
            case 'NOT_STARTED': return 'bg-slate-500/10 text-slate-400';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }
}

