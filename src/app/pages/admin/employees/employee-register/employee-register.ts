import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { EmployeeService } from '../../../../services/employee.service';
import { Department, Designation, EmployeeProfile } from '../../../../models/employee.model';

@Component({
    selector: 'app-employee-register',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './employee-register.html',
    styleUrl: './employee-register.css',
})
export class EmployeeRegister implements OnInit {
    form!: FormGroup;
    departments = signal<Department[]>([]);
    designations = signal<Designation[]>([]);
    managers = signal<EmployeeProfile[]>([]);
    loadingManagers = signal(false);
    loading = signal(false);
    error = signal('');
    constructor(
        private fb: FormBuilder,
        private employeeService: EmployeeService,
        private router: Router
    ) {}
    ngOnInit(): void {
        this.initForm();
        this.loadDropdowns();
        this.loadManagers();
        
        const initialRole = this.form.get('role')?.value;
        if (initialRole === 'EMPLOYEE') {
            this.form.get('managerCode')?.setValidators([Validators.required]);
            this.form.get('managerCode')?.updateValueAndValidity();
        }
        
        this.form.get('role')?.valueChanges.subscribe(role => {
            const managerControl = this.form.get('managerCode');
            if (role === 'EMPLOYEE') {
                managerControl?.setValidators([Validators.required]);
            } else {
                managerControl?.clearValidators();
                managerControl?.setValue('');
            }
            managerControl?.updateValueAndValidity();
        });
    }
    private initForm(): void {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['EMPLOYEE'],
            employeeCode: [''],
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            phone: [''],
            dateOfBirth: [''],
            gender: [''],
            address: [''],
            emergencyContactName: [''],
            emergencyContactPhone: [''],
            departmentId: [''],
            designationId: [''],
            joiningDate: ['', [Validators.required]],
            salary: [''],
            managerCode: [''], 
        });
    }
    private loadDropdowns(): void {
        this.employeeService.getDepartments().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.departments.set(res.data.filter(d => d.isActive));
                }
            }
        });
        this.employeeService.getDesignations().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.designations.set(res.data.filter(d => d.isActive));
                }
            }
        });
    }

    private loadManagers(): void {
        this.loadingManagers.set(true);
        forkJoin({
            managers: this.employeeService.getEmployees(undefined, undefined, 'MANAGER', true, 0, 100).pipe(catchError(() => of(null))),
            admins: this.employeeService.getEmployees(undefined, undefined, 'ADMIN', true, 0, 100).pipe(catchError(() => of(null)))
        }).subscribe({
            next: (res) => {
                const allManagers: EmployeeProfile[] = [];
                if (res.managers?.success && res.managers.data) {
                    allManagers.push(...res.managers.data.content);
                }
                if (res.admins?.success && res.admins.data) {
                    allManagers.push(...res.admins.data.content);
                }
                allManagers.sort((a, b) => {
                    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                this.managers.set(allManagers);
                this.loadingManagers.set(false);
            },
            error: () => this.loadingManagers.set(false)
        });
    }

    getManagerDisplayName(manager: EmployeeProfile): string {
        return `${manager.firstName} ${manager.lastName} (${manager.employeeCode})`;
    }
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading.set(true);
        this.error.set('');
        const raw = this.form.getRawValue();
        const request: any = {};
        for (const key of Object.keys(raw)) {
            let val = raw[key];
            if (val === '' || val === null || val === undefined) continue;
            if ((key === 'departmentId' || key === 'designationId') && typeof val === 'string') {
                val = parseInt(val, 10);
                if (isNaN(val)) continue;
            }
            if (key === 'salary' && typeof val === 'string') {
                val = parseFloat(val);
                if (isNaN(val)) continue;
            }
            request[key] = val;
        }
        this.employeeService.registerEmployee(request).subscribe({
            next: (res) => {
                if (res.success) {
                    this.router.navigate(['/admin/employees']);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Registration failed. Please try again.');
                this.loading.set(false);
            }
        });
    }
    hasError(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && control.touched);
    }
    getError(field: string): string {
        const control = this.form.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Invalid email format';
        if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
        return 'Invalid value';
    }
}