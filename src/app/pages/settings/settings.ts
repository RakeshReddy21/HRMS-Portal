import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeSelfService } from '../../services/employee-self.service';
import { EmployeeProfile } from '../../models/employee.model';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './settings.html',
    styleUrl: './settings.css',
})
export class Settings implements OnInit {
    profile = signal<EmployeeProfile | null>(null);
    loading = signal(true);
    saving = signal(false);
    error = signal('');
    success = signal('');

    activeTab = signal<'profile' | 'password'>('profile');

    profileForm!: FormGroup;
    passwordForm!: FormGroup;

    constructor(
        private empService: EmployeeSelfService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.profileForm = this.fb.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            phone: [''],
            dateOfBirth: [''],
            gender: [''],
            address: [''],
            emergencyContactName: [''],
            emergencyContactPhone: [''],
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        }, { validators: this.passwordMatchValidator });

        this.loadProfile();
    }

    passwordMatchValidator(group: FormGroup) {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }

    loadProfile(): void {
        this.loading.set(true);
        this.empService.getMyProfile().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.profile.set(res.data);
                    this.profileForm.patchValue({
                        firstName: res.data.firstName,
                        lastName: res.data.lastName,
                        phone: res.data.phone || '',
                        dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
                        gender: res.data.gender || '',
                        address: res.data.address || '',
                        emergencyContactName: res.data.emergencyContactName || '',
                        emergencyContactPhone: res.data.emergencyContactPhone || '',
                    });
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load profile');
                this.loading.set(false);
            }
        });
    }

    switchTab(tab: 'profile' | 'password'): void {
        this.activeTab.set(tab);
        this.error.set('');
        this.success.set('');
    }

    saveProfile(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.error.set('');
        this.empService.updateMyProfile(this.profileForm.getRawValue()).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.profile.set(res.data);
                    this.showToast('Profile updated successfully');
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to update profile');
                this.saving.set(false);
            }
        });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        if (this.passwordForm.errors?.['passwordMismatch']) {
            this.error.set('New password and confirm password do not match');
            return;
        }

        this.saving.set(true);
        this.error.set('');
        const formValue = this.passwordForm.getRawValue();
        this.empService.changePassword({
            currentPassword: formValue.currentPassword,
            newPassword: formValue.newPassword,
            confirmPassword: formValue.confirmPassword
        }).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Password changed successfully');
                    this.passwordForm.reset();
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to change password');
                this.saving.set(false);
            }
        });
    }

    hasError(form: FormGroup, field: string): boolean {
        const control = form.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getError(form: FormGroup, field: string): string {
        const control = form.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['minlength']) return `Min ${control.errors['minlength'].requiredLength} characters`;
        return 'Invalid value';
    }

    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }
}

