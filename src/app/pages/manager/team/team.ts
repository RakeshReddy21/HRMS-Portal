import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerService } from '../../../services/manager.service';
import { EmployeeDirectoryEntry } from '../../../models/dashboard.model';

@Component({
    selector: 'app-team',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './team.html',
    styleUrl: './team.css',
})
export class Team implements OnInit {
    members = signal<EmployeeDirectoryEntry[]>([]);
    loading = signal(true);
    error = signal('');

    page = signal(0);
    pageSize = 20;
    totalPages = signal(0);
    totalElements = signal(0);
    startItem = computed(() => this.totalElements() === 0 ? 0 : this.page() * this.pageSize + 1);
    endItem = computed(() => Math.min((this.page() + 1) * this.pageSize, this.totalElements()));

    sortBy = 'firstName';
    direction = 'asc';

    skeletonRows = Array(8).fill(0);

    constructor(private managerService: ManagerService) {}

    ngOnInit(): void {
        this.loadMembers();
    }

    loadMembers(): void {
        this.loading.set(true);
        this.error.set('');
        this.managerService.getTeamMembers(
            this.page(),
            this.pageSize,
            this.sortBy,
            this.direction
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.members.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load team members');
                this.loading.set(false);
            }
        });
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadMembers();
        }
    }

    onSortChange(field: string): void {
        if (this.sortBy === field) {
            this.direction = this.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.direction = 'asc';
        }
        this.page.set(0);
        this.loadMembers();
    }

    getInitials(firstName: string, lastName: string): string {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    }

    getRoleClass(role: string): string {
        switch (role) {
            case 'ADMIN': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
            case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'EMPLOYEE': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
}

