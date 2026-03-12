import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../../models/employee.model';

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './department-list.html',
    styleUrl: './department-list.css',
})
export class DepartmentList implements OnInit {
    departments = signal<Department[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    showModal = signal(false);
    editing = signal<Department | null>(null);
    saving = signal(false);
    form!: FormGroup;

    skeletonRows = Array(5).fill(0);

    constructor(
        private departmentService: DepartmentService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadDepartments();
    }

    private initForm(): void {
        this.form = this.fb.group({
            departmentName: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(500)]],
        });
    }

    loadDepartments(): void {
        this.loading.set(true);
        this.error.set('');
        this.departmentService.getAll().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.departments.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load departments');
                this.loading.set(false);
            }
        });
    }

    openCreate(): void {
        this.editing.set(null);
        this.form.reset();
        this.showModal.set(true);
    }

    openEdit(dept: Department): void {
        this.editing.set(dept);
        this.form.patchValue({
            departmentName: dept.departmentName,
            description: dept.description || '',
        });
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.editing.set(null);
        this.form.reset();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saving.set(true);
        this.error.set('');
        const request = this.form.getRawValue();
        const edit = this.editing();

        const action$ = edit
            ? this.departmentService.update(edit.departmentId, request)
            : this.departmentService.create(request);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(edit ? 'Department updated successfully' : 'Department created successfully');
                    this.closeModal();
                    this.loadDepartments();
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Operation failed');
                this.saving.set(false);
            }
        });
    }

    toggleStatus(dept: Department): void {
        const action$ = dept.isActive
            ? this.departmentService.deactivate(dept.departmentId)
            : this.departmentService.activate(dept.departmentId);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(dept.isActive ? 'Department deactivated' : 'Department activated');
                    this.loadDepartments();
                }
            },
            error: (err) => this.error.set(err.error?.message || 'Action failed')
        });
    }

    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }

    hasError(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getError(field: string): string {
        const control = this.form.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['maxlength']) return `Max ${control.errors['maxlength'].requiredLength} characters`;
        return 'Invalid value';
    }

    get activeCount(): number {
        return this.departments().filter(d => d.isActive).length;
    }

    get inactiveCount(): number {
        return this.departments().filter(d => !d.isActive).length;
    }
}

