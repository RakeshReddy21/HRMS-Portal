import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { EmployeeService } from '../../../../services/employee.service';
import { Department, Designation, EmployeeProfile } from '../../../../models/employee.model';

@Component({
    selector: 'app-employee-list',
    imports: [RouterLink, FormsModule],
    templateUrl: './employee-list.html',
    styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
    employees = signal<EmployeeProfile[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');
    selectedEmployee = signal<EmployeeProfile | null>(null);
    departments = signal<Department[]>([]);
    designations = signal<Designation[]>([]);
    currentPage = signal(0);
    totalPages = signal(0);
    totalElements = signal(0);
    pageSize = 12;

    searchKeyword = '';
    filterDepartment: number | null = null;
    filterRole = '';
    filterStatus: boolean | null = null;
    startItem = computed(() => this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize + 1);
    endItem = computed(() => Math.min((this.currentPage() + 1) * this.pageSize, this.totalElements()));

    skeletonCards = Array(8).fill(0);
    private searchTimer: any;

    // Edit modal state
    showEditModal = signal(false);
    saving = signal(false);
    editError = signal('');
    editForm: any = {};
    managers = signal<EmployeeProfile[]>([]);
    loadingManagers = signal(false);

    constructor(private employeeService: EmployeeService) {}

    ngOnInit(): void {
        this.loadEmployees();
        this.loadDepartments();
        this.loadDesignations();
    }

    loadEmployees(): void {
        this.loading.set(true);
        this.error.set('');
        this.employeeService.getEmployees(
            this.searchKeyword || undefined,
            this.filterDepartment ?? undefined,
            this.filterRole || undefined,
            this.filterStatus ?? undefined,
            this.currentPage(),
            this.pageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.employees.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load employees');
                this.loading.set(false);
            }
        });
    }

    loadDepartments(): void {
        this.employeeService.getDepartments().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.departments.set(res.data.filter(d => d.isActive));
                }
            }
        });
    }

    loadDesignations(): void {
        this.employeeService.getDesignations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.designations.set(res.data.filter(d => d.isActive));
                }
            }
        });
    }

    loadManagers(): void {
        this.loadingManagers.set(true);
        forkJoin({
            managers: this.employeeService.getEmployees(undefined, undefined, 'MANAGER', true, 0, 100).pipe(catchError(() => of(null))),
            admins: this.employeeService.getEmployees(undefined, undefined, 'ADMIN', true, 0, 100).pipe(catchError(() => of(null)))
        }).subscribe({
            next: (res) => {
                const all: EmployeeProfile[] = [];
                if (res.managers?.success && res.managers.data) all.push(...res.managers.data.content);
                if (res.admins?.success && res.admins.data) all.push(...res.admins.data.content);
                all.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
                this.managers.set(all);
                this.loadingManagers.set(false);
            },
            error: () => this.loadingManagers.set(false)
        });
    }

    getManagerDisplayName(m: EmployeeProfile): string {
        return `${m.firstName} ${m.lastName} (${m.employeeCode})`;
    }

    onSearchChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.searchKeyword = value;
            this.currentPage.set(0);
            this.loadEmployees();
        }, 400);
    }

    onDepartmentChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.filterDepartment = value ? +value : null;
        this.currentPage.set(0);
        this.loadEmployees();
    }

    onRoleChange(event: Event): void {
        this.filterRole = (event.target as HTMLSelectElement).value;
        this.currentPage.set(0);
        this.loadEmployees();
    }

    onStatusChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.filterStatus = value === '' ? null : value === 'true';
        this.currentPage.set(0);
        this.loadEmployees();
    }

    selectEmployee(emp: EmployeeProfile): void {
        this.selectedEmployee.set(emp);
    }

    closeDetail(): void {
        this.selectedEmployee.set(null);
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
            this.loadEmployees();
        }
    }

    toggleStatus(emp: EmployeeProfile): void {
        const action$ = emp.isActive
            ? this.employeeService.deactivateEmployee(emp.employeeCode)
            : this.employeeService.activateEmployee(emp.employeeCode);
        action$.subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.selectedEmployee.set(res.data);
                    this.loadEmployees();
                }
            },
            error: (err) => this.error.set(err.error?.message || 'Action failed')
        });
    }

    // ─── Edit Employee ────────────────────────

    openEditModal(): void {
        const emp = this.selectedEmployee();
        if (!emp) return;

        this.editForm = {
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            dateOfBirth: emp.dateOfBirth ? this.toInputDate(emp.dateOfBirth) : '',
            gender: emp.gender || '',
            address: emp.address || '',
            emergencyContactName: emp.emergencyContactName || '',
            emergencyContactPhone: emp.emergencyContactPhone || '',
            departmentId: emp.departmentId || null,
            designationId: emp.designationId || null,
            joiningDate: emp.joiningDate ? this.toInputDate(emp.joiningDate) : '',
            salary: emp.salary || null,
            role: emp.role || 'EMPLOYEE',
            managerCode: emp.manager?.managerCode || '',
        };

        this.editError.set('');
        if (this.managers().length === 0) this.loadManagers();
        this.showEditModal.set(true);
    }

    closeEditModal(): void {
        this.showEditModal.set(false);
        this.editError.set('');
    }

    saveEmployee(): void {
        const emp = this.selectedEmployee();
        if (!emp) return;

        if (!this.editForm.firstName?.trim() || !this.editForm.lastName?.trim() || !this.editForm.email?.trim()) {
            this.editError.set('First name, last name, and email are required.');
            return;
        }

        this.saving.set(true);
        this.editError.set('');

        const request: any = {
            firstName: this.editForm.firstName.trim(),
            lastName: this.editForm.lastName.trim(),
            email: this.editForm.email.trim(),
            phone: this.editForm.phone?.trim() || null,
            dateOfBirth: this.editForm.dateOfBirth || null,
            gender: this.editForm.gender || null,
            address: this.editForm.address?.trim() || null,
            emergencyContactName: this.editForm.emergencyContactName?.trim() || null,
            emergencyContactPhone: this.editForm.emergencyContactPhone?.trim() || null,
            departmentId: this.editForm.departmentId || null,
            designationId: this.editForm.designationId || null,
            joiningDate: this.editForm.joiningDate || null,
            salary: this.editForm.salary || null,
            role: this.editForm.role || null,
        };

        this.employeeService.updateEmployee(emp.employeeCode, request).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.selectedEmployee.set(res.data);
                    this.loadEmployees();
                    this.showToast('Employee updated successfully');
                    this.closeEditModal();

                    // Update manager if changed
                    if (this.editForm.managerCode && this.editForm.managerCode !== emp.manager?.managerCode) {
                        this.employeeService.assignManager(emp.employeeCode, this.editForm.managerCode).subscribe({
                            next: (mRes) => {
                                if (mRes.success && mRes.data) {
                                    this.selectedEmployee.set(mRes.data);
                                    this.loadEmployees();
                                }
                            },
                            error: (err) => {
                                this.error.set('Updated but manager assign failed: ' + (err.error?.message || ''));
                            }
                        });
                    }
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.editError.set(err.error?.message || 'Failed to update employee');
                this.saving.set(false);
            }
        });
    }

    // ─── Helpers ─────────────────────────────

    getInitials(emp: EmployeeProfile): string {
        return (emp.firstName[0] + emp.lastName[0]).toUpperCase();
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'ADMIN': return 'bg-violet-500/15 text-violet-400 border border-violet-500/20';
            case 'MANAGER': return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
            case 'EMPLOYEE': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
        }
    }

    getAvatarGradient(role: string): string {
        switch (role) {
            case 'ADMIN': return 'from-violet-500 to-purple-600 shadow-violet-500/20';
            case 'MANAGER': return 'from-blue-500 to-indigo-600 shadow-blue-500/20';
            default: return 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
        }
    }

    formatSalary(salary: number): string {
        if (!salary) return '—';
        return '₹' + salary.toLocaleString('en-IN');
    }

    private toInputDate(value: any): string {
        if (!value) return '';
        if (typeof value === 'string') return value.split('T')[0];
        if (Array.isArray(value)) {
            return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        }
        return '';
    }

    private showToast(msg: string): void {
        this.success.set(msg);
        setTimeout(() => this.success.set(''), 3000);
    }
}
