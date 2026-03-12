import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { EmployeeDirectoryEntry } from '../../../models/dashboard.model';

@Component({
    selector: 'app-employee-directory',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employee-directory.html',
    styleUrl: './employee-directory.css',
})
export class EmployeeDirectory implements OnInit {
    loading = signal(true);
    employees = signal<EmployeeDirectoryEntry[]>([]);
    filtered = signal<EmployeeDirectoryEntry[]>([]);

    keyword = '';
    departmentFilter = '';
    departments: string[] = [];
    page = signal(0);
    pageSize = 12;
    totalPages = signal(0);
    pagedEmployees = signal<EmployeeDirectoryEntry[]>([]);

    skeletonRows = Array(8).fill(0);

    constructor(private empService: EmployeeSelfService) {}

    ngOnInit(): void {
        this.loadDirectory();
    }

    loadDirectory(): void {
        this.loading.set(true);
        this.empService.searchDirectory().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const list = res.data.content || [];
                    this.employees.set(list);
                    const depts = new Set<string>();
                    list.forEach((e: EmployeeDirectoryEntry) => {
                        if (e.departmentName) depts.add(e.departmentName);
                    });
                    this.departments = Array.from(depts).sort();
                    this.applyFilters();
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    onSearch(): void {
        this.page.set(0);
        this.applyFilters();
    }

    onDepartmentChange(event: Event): void {
        this.departmentFilter = (event.target as HTMLSelectElement).value;
        this.page.set(0);
        this.applyFilters();
    }

    applyFilters(): void {
        let list = [...this.employees()];
        const kw = this.keyword.toLowerCase().trim();
        if (kw) {
            list = list.filter(e =>
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(kw) ||
                e.email.toLowerCase().includes(kw) ||
                e.employeeCode.toLowerCase().includes(kw)
            );
        }
        if (this.departmentFilter) {
            list = list.filter(e => e.departmentName === this.departmentFilter);
        }
        this.filtered.set(list);
        this.totalPages.set(Math.ceil(list.length / this.pageSize) || 1);
        this.updatePage();
    }

    updatePage(): void {
        const start = this.page() * this.pageSize;
        this.pagedEmployees.set(this.filtered().slice(start, start + this.pageSize));
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.updatePage();
        }
    }

    getInitials(first: string, last: string): string {
        return (first?.[0] || '') + (last?.[0] || '');
    }

    getAvatarColor(name: string): string {
        const colors = [
            'bg-violet-500/20 text-violet-400',
            'bg-blue-500/20 text-blue-400',
            'bg-emerald-500/20 text-emerald-400',
            'bg-amber-500/20 text-amber-400',
            'bg-pink-500/20 text-pink-400',
            'bg-cyan-500/20 text-cyan-400',
            'bg-indigo-500/20 text-indigo-400',
            'bg-rose-500/20 text-rose-400',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    getRoleBadge(role: string): string {
        switch (role) {
            case 'ADMIN': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'MANAGER': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
}

