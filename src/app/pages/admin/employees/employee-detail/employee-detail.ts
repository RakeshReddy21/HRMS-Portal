import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { EmployeeService } from '../../../../services/employee.service';
import { EmployeeProfile, Department, Designation } from '../../../../models/employee.model';

@Component({
    selector: 'app-employee-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './employee-detail.html',
    styleUrl: './employee-detail.css',
})
export class EmployeeDetail implements OnInit {
    employee = signal<EmployeeProfile | null>(null);
    loading = signal(true);
    error = signal('');
    success = signal('');
    updating = signal(false);

    // Edit modal state
    showEditModal = signal(false);
    saving = signal(false);
    editError = signal('');
    departments = signal<Department[]>([]);
    designations = signal<Designation[]>([]);
    managers = signal<EmployeeProfile[]>([]);
    loadingManagers = signal(false);

    editForm: any = {};

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService
    ) {}

    ngOnInit(): void {
        const employeeCode = this.route.snapshot.paramMap.get('code');
        if (employeeCode) {
            this.loadEmployee(employeeCode);
        } else {
            this.error.set('Invalid employee code');
            this.loading.set(false);
        }
    }

    loadEmployee(code: string): void {
        this.loading.set(true);
        this.error.set('');
        this.employeeService.getEmployee(code).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.employee.set(res.data);
                } else {
                    this.error.set('Employee not found');
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load employee details');
                this.loading.set(false);
            }
        });
    }

    toggleStatus(): void {
        const emp = this.employee();
        if (!emp) return;

        if (!confirm(`Are you sure you want to ${emp.isActive ? 'deactivate' : 'activate'} this employee?`)) {
            return;
        }

        this.updating.set(true);
        const action$ = emp.isActive
            ? this.employeeService.deactivateEmployee(emp.employeeCode)
            : this.employeeService.activateEmployee(emp.employeeCode);

        action$.subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.employee.set(res.data);
                    this.showToast(emp.isActive ? 'Employee deactivated' : 'Employee activated');
                }
                this.updating.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to update employee status');
                this.updating.set(false);
            }
        });
    }

    // ─── Edit Modal ──────────────────────────

    openEditModal(): void {
        const emp = this.employee();
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
        this.loadDropdowns();
        this.showEditModal.set(true);
    }

    closeEditModal(): void {
        this.showEditModal.set(false);
        this.editError.set('');
    }

    loadDropdowns(): void {
        this.employeeService.getDepartments().subscribe({
            next: (res) => { if (res.success && res.data) this.departments.set(res.data); }
        });
        this.employeeService.getDesignations().subscribe({
            next: (res) => { if (res.success && res.data) this.designations.set(res.data); }
        });
        if (this.managers().length === 0) this.loadManagers();
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

    saveEmployee(): void {
        const emp = this.employee();
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
                    this.employee.set(res.data);
                    this.showToast('Employee updated successfully');
                    this.closeEditModal();

                    // Update manager if changed
                    if (this.editForm.managerCode && this.editForm.managerCode !== emp.manager?.managerCode) {
                        this.employeeService.assignManager(emp.employeeCode, this.editForm.managerCode).subscribe({
                            next: (mRes) => {
                                if (mRes.success && mRes.data) {
                                    this.employee.set(mRes.data);
                                }
                            },
                            error: (err) => {
                                this.error.set('Employee updated but manager assignment failed: ' + (err.error?.message || 'Unknown error'));
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

    retry(): void {
        const emp = this.employee();
        if (emp) {
            this.loadEmployee(emp.employeeCode);
        }
    }

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

    formatDate(value: any): string {
        if (!value) return '—';
        if (typeof value === 'string') {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return String(value);
    }

    private toInputDate(value: any): string {
        if (!value) return '';
        if (typeof value === 'string') {
            return value.split('T')[0];
        }
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
