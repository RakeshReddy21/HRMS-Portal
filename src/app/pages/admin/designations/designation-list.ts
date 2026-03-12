import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DesignationService } from '../../../services/designation.service';
import { Designation } from '../../../models/employee.model';

@Component({
    selector: 'app-designation-list',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './designation-list.html',
    styleUrl: './designation-list.css',
})
export class DesignationList implements OnInit {
    designations = signal<Designation[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    showModal = signal(false);
    editing = signal<Designation | null>(null);
    saving = signal(false);
    form!: FormGroup;

    skeletonRows = Array(5).fill(0);

    constructor(
        private designationService: DesignationService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadDesignations();
    }

    private initForm(): void {
        this.form = this.fb.group({
            designationName: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(500)]],
        });
    }

    loadDesignations(): void {
        this.loading.set(true);
        this.error.set('');
        this.designationService.getAll().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.designations.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load designations');
                this.loading.set(false);
            }
        });
    }

    openCreate(): void {
        this.editing.set(null);
        this.form.reset();
        this.showModal.set(true);
    }

    openEdit(desig: Designation): void {
        this.editing.set(desig);
        this.form.patchValue({
            designationName: desig.designationName,
            description: desig.description || '',
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
            ? this.designationService.update(edit.designationId, request)
            : this.designationService.create(request);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(edit ? 'Designation updated successfully' : 'Designation created successfully');
                    this.closeModal();
                    this.loadDesignations();
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Operation failed');
                this.saving.set(false);
            }
        });
    }

    toggleStatus(desig: Designation): void {
        const action$ = desig.isActive
            ? this.designationService.deactivate(desig.designationId)
            : this.designationService.activate(desig.designationId);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(desig.isActive ? 'Designation deactivated' : 'Designation activated');
                    this.loadDesignations();
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
        return this.designations().filter(d => d.isActive).length;
    }

    get inactiveCount(): number {
        return this.designations().filter(d => !d.isActive).length;
    }
}

