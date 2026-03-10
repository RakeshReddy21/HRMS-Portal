import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagerService } from '../../../services/manager.service';
import { PerformanceReview, ManagerFeedbackRequest } from '../../../models/dashboard.model';

@Component({
    selector: 'app-team-performance',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './team-performance.html',
    styleUrl: './team-performance.css',
})
export class TeamPerformance implements OnInit {
    reviews = signal<PerformanceReview[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    page = signal(0);
    pageSize = 10;
    totalPages = signal(0);
    totalElements = signal(0);
    statusFilter = '';
    showFeedbackModal = signal(false);
    selectedReview = signal<PerformanceReview | null>(null);
    submitting = signal(false);
    feedbackForm!: FormGroup;

    skeletonRows = Array(5).fill(0);

    constructor(
        private managerService: ManagerService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.feedbackForm = this.fb.group({
            managerRating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
            managerFeedback: ['', [Validators.required, Validators.maxLength(1000)]]
        });
        this.loadReviews();
    }

    loadReviews(): void {
        this.loading.set(true);
        this.error.set('');
        this.managerService.getTeamReviews(
            this.statusFilter || undefined,
            this.page(),
            this.pageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.reviews.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load performance reviews');
                this.loading.set(false);
            }
        });
    }

    onStatusFilterChange(event: Event): void {
        this.statusFilter = (event.target as HTMLSelectElement).value;
        this.page.set(0);
        this.loadReviews();
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadReviews();
        }
    }

    openFeedbackModal(review: PerformanceReview): void {
        this.selectedReview.set(review);
        this.feedbackForm.patchValue({
            managerRating: review.managerRating || null,
            managerFeedback: review.managerFeedback || ''
        });
        this.error.set('');
        this.showFeedbackModal.set(true);
    }

    closeFeedbackModal(): void {
        this.showFeedbackModal.set(false);
        this.selectedReview.set(null);
        this.feedbackForm.reset();
    }

    submitFeedback(): void {
        if (this.feedbackForm.invalid) {
            this.feedbackForm.markAllAsTouched();
            return;
        }

        const review = this.selectedReview();
        if (!review) return;

        this.submitting.set(true);
        this.error.set('');

        const formValue = this.feedbackForm.getRawValue();
        const request: ManagerFeedbackRequest = {
            managerRating: formValue.managerRating,
            managerFeedback: formValue.managerFeedback
        };

        this.managerService.provideReviewFeedback(review.reviewId, request).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Feedback submitted successfully');
                    this.closeFeedbackModal();
                    this.loadReviews();
                }
                this.submitting.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to submit feedback');
                this.submitting.set(false);
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'DRAFT': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            case 'SUBMITTED': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'REVIEWED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }

    formatDate(value: any): string {
        if (!value) return '';
        let str: string;
        if (typeof value === 'string') {
            str = value.split('T')[0];
        } else if (Array.isArray(value)) {
            str = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
        } else {
            return '';
        }
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    getEmployeeName(review: PerformanceReview): string {
        if (review.employee) {
            if (typeof review.employee === 'object' && 'firstName' in review.employee) {
                return `${review.employee.firstName} ${review.employee.lastName}`;
            }
        }
        return 'Unknown Employee';
    }

    getInitials(review: PerformanceReview): string {
        const name = this.getEmployeeName(review);
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    hasError(field: string): boolean {
        const control = this.feedbackForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getError(field: string): string {
        const control = this.feedbackForm.get(field);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['min']) return 'Rating must be at least 1';
        if (control.errors['max']) return 'Rating must be at most 5';
        if (control.errors['maxlength']) return `Max ${control.errors['maxlength'].requiredLength} characters`;
        return 'Invalid value';
    }

    private showToast(message: string): void {
        this.success.set(message);
        setTimeout(() => this.success.set(''), 3000);
    }
}

