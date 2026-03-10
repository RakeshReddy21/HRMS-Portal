import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeSelfService } from '../../../services/employee-self.service';
import { PerformanceReview, PerformanceReviewRequest, Goal, GoalRequest, GoalProgressRequest } from '../../../models/dashboard.model';
type TabKey = 'reviews' | 'goals';
@Component({
    selector: 'app-my-performance',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './my-performance.html',
    styleUrl: './my-performance.css',
})
export class MyPerformance implements OnInit {
    activeTab = signal<TabKey>('reviews');
    success = signal('');
    error = signal('');
    reviews = signal<PerformanceReview[]>([]);
    reviewsLoading = signal(true);
    reviewPage = signal(0);
    reviewTotalPages = signal(0);
    reviewTotalElements = signal(0);
    reviewPageSize = 10;
    reviewStatusFilter = '';
    goals = signal<Goal[]>([]);
    goalsLoading = signal(true);
    goalPage = signal(0);
    goalTotalPages = signal(0);
    goalTotalElements = signal(0);
    goalPageSize = 10;
    goalStatusFilter = '';
    goalYearFilter: number | null = null;
    showReviewModal = signal(false);
    reviewSaving = signal(false);
    editingReview = signal<PerformanceReview | null>(null);
    reviewForm!: FormGroup;
    showGoalModal = signal(false);
    goalSaving = signal(false);
    goalForm!: FormGroup;
    showProgressModal = signal(false);
    progressSaving = signal(false);
    editingGoal = signal<Goal | null>(null);
    progressForm!: FormGroup;
    selectedReview = signal<PerformanceReview | null>(null);
    skeletonRows = Array(5).fill(0);
    constructor(
        private empService: EmployeeSelfService,
        private fb: FormBuilder
    ) {}
    ngOnInit(): void {
        this.reviewForm = this.fb.group({
            reviewPeriod: ['', Validators.required],
            keyDeliverables: [''],
            accomplishments: [''],
            areasOfImprovement: [''],
            selfAssessmentRating: [null, [Validators.min(1), Validators.max(5)]],
        });
        this.goalForm = this.fb.group({
            title: ['', Validators.required],
            description: [''],
            deadline: ['', Validators.required],
            priority: ['MEDIUM', Validators.required],
        });
        this.progressForm = this.fb.group({
            progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            status: [''],
        });
        this.loadReviews();
        this.loadGoals();
    }
    switchTab(tab: TabKey): void {
        this.activeTab.set(tab);
    }
    loadReviews(): void {
        this.reviewsLoading.set(true);
        this.empService.getMyReviews(
            this.reviewStatusFilter || undefined,
            this.reviewPage(),
            this.reviewPageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.reviews.set(res.data.content);
                    this.reviewTotalPages.set(res.data.totalPages);
                    this.reviewTotalElements.set(res.data.totalElements);
                }
                this.reviewsLoading.set(false);
            },
            error: () => this.reviewsLoading.set(false),
        });
    }
    onReviewStatusChange(event: Event): void {
        this.reviewStatusFilter = (event.target as HTMLSelectElement).value;
        this.reviewPage.set(0);
        this.loadReviews();
    }
    goToReviewPage(page: number): void {
        if (page >= 0 && page < this.reviewTotalPages()) {
            this.reviewPage.set(page);
            this.loadReviews();
        }
    }
    openCreateReview(): void {
        this.editingReview.set(null);
        this.reviewForm.reset({ selfAssessmentRating: null });
        this.showReviewModal.set(true);
    }
    openEditReview(r: PerformanceReview): void {
        this.editingReview.set(r);
        this.reviewForm.patchValue({
            reviewPeriod: r.reviewPeriod,
            keyDeliverables: r.keyDeliverables || '',
            accomplishments: r.accomplishments || '',
            areasOfImprovement: r.areasOfImprovement || '',
            selfAssessmentRating: r.selfAssessmentRating,
        });
        this.showReviewModal.set(true);
    }
    closeReviewModal(): void {
        this.showReviewModal.set(false);
        this.reviewForm.reset();
        this.editingReview.set(null);
    }
    onSaveReview(): void {
        if (this.reviewForm.invalid) {
            this.reviewForm.markAllAsTouched();
            return;
        }
        this.reviewSaving.set(true);
        this.error.set('');
        const raw = this.reviewForm.getRawValue();
        const req: PerformanceReviewRequest = {
            reviewPeriod: raw.reviewPeriod,
            keyDeliverables: raw.keyDeliverables || undefined,
            accomplishments: raw.accomplishments || undefined,
            areasOfImprovement: raw.areasOfImprovement || undefined,
            selfAssessmentRating: raw.selfAssessmentRating || undefined,
        };
        const editing = this.editingReview();
        const obs$ = editing
            ? this.empService.updateReview(editing.reviewId, req)
            : this.empService.createReview(req);
        obs$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(editing ? 'Review updated' : 'Review created as draft');
                    this.closeReviewModal();
                    this.loadReviews();
                }
                this.reviewSaving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to save review');
                this.reviewSaving.set(false);
            },
        });
    }
    onSaveAndSubmitReview(): void {
        if (this.reviewForm.invalid) {
            this.reviewForm.markAllAsTouched();
            return;
        }
        const raw = this.reviewForm.getRawValue();
        if (!raw.keyDeliverables) {
            this.error.set('Key deliverables are required before submitting');
            return;
        }
        if (!raw.selfAssessmentRating) {
            this.error.set('Self assessment rating is required before submitting');
            return;
        }
        if (!confirm('Submit this review to your manager? You won\'t be able to edit it afterwards.')) return;
        this.reviewSaving.set(true);
        this.error.set('');
        const req: PerformanceReviewRequest = {
            reviewPeriod: raw.reviewPeriod,
            keyDeliverables: raw.keyDeliverables || undefined,
            accomplishments: raw.accomplishments || undefined,
            areasOfImprovement: raw.areasOfImprovement || undefined,
            selfAssessmentRating: raw.selfAssessmentRating || undefined,
        };
        const editing = this.editingReview();
        const save$ = editing
            ? this.empService.updateReview(editing.reviewId, req)
            : this.empService.createReview(req);
        save$.subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.empService.submitReview(res.data.reviewId).subscribe({
                        next: (submitRes) => {
                            if (submitRes.success) {
                                this.showToast('Review submitted to manager');
                                this.closeReviewModal();
                                this.loadReviews();
                            }
                            this.reviewSaving.set(false);
                        },
                        error: (err) => {
                            this.error.set(err.error?.message || 'Failed to submit review');
                            this.reviewSaving.set(false);
                        },
                    });
                } else {
                    this.reviewSaving.set(false);
                }
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to save review');
                this.reviewSaving.set(false);
            },
        });
    }
    submitReview(r: PerformanceReview): void {
        if (!confirm('Submit this review to your manager? You won\'t be able to edit it afterwards.')) return;
        this.empService.submitReview(r.reviewId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Review submitted to manager');
                    this.loadReviews();
                }
            },
            error: (err) => this.error.set(err.error?.message || 'Failed to submit review'),
        });
    }
    viewReviewDetail(r: PerformanceReview): void {
        this.selectedReview.set(r);
    }
    closeDetail(): void {
        this.selectedReview.set(null);
    }
    loadGoals(): void {
        this.goalsLoading.set(true);
        this.empService.getMyGoals(
            this.goalYearFilter ?? undefined,
            this.goalStatusFilter || undefined,
            this.goalPage(),
            this.goalPageSize
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.goals.set(res.data.content);
                    this.goalTotalPages.set(res.data.totalPages);
                    this.goalTotalElements.set(res.data.totalElements);
                }
                this.goalsLoading.set(false);
            },
            error: () => this.goalsLoading.set(false),
        });
    }
    onGoalStatusChange(event: Event): void {
        this.goalStatusFilter = (event.target as HTMLSelectElement).value;
        this.goalPage.set(0);
        this.loadGoals();
    }
    goToGoalPage(page: number): void {
        if (page >= 0 && page < this.goalTotalPages()) {
            this.goalPage.set(page);
            this.loadGoals();
        }
    }
    openCreateGoal(): void {
        this.goalForm.reset({ priority: 'MEDIUM' });
        this.showGoalModal.set(true);
    }
    closeGoalModal(): void {
        this.showGoalModal.set(false);
        this.goalForm.reset();
    }
    onSaveGoal(): void {
        if (this.goalForm.invalid) {
            this.goalForm.markAllAsTouched();
            return;
        }
        this.goalSaving.set(true);
        this.error.set('');
        const raw = this.goalForm.getRawValue();
        const req: GoalRequest = {
            title: raw.title,
            description: raw.description || undefined,
            deadline: raw.deadline,
            priority: raw.priority,
        };
        this.empService.createGoal(req).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Goal created');
                    this.closeGoalModal();
                    this.loadGoals();
                }
                this.goalSaving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to create goal');
                this.goalSaving.set(false);
            },
        });
    }
    openProgressModal(g: Goal): void {
        this.editingGoal.set(g);
        this.progressForm.patchValue({ progress: g.progress, status: g.status });
        this.showProgressModal.set(true);
    }
    closeProgressModal(): void {
        this.showProgressModal.set(false);
        this.editingGoal.set(null);
    }
    onSaveProgress(): void {
        if (this.progressForm.invalid) return;
        const goal = this.editingGoal();
        if (!goal) return;
        this.progressSaving.set(true);
        this.error.set('');
        const raw = this.progressForm.getRawValue();
        const req: GoalProgressRequest = {
            progress: raw.progress,
            status: raw.status || undefined,
        };
        this.empService.updateGoalProgress(goal.goalId, req).subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast('Goal progress updated');
                    this.closeProgressModal();
                    this.loadGoals();
                }
                this.progressSaving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to update progress');
                this.progressSaving.set(false);
            },
        });
    }
    getReviewStatusClass(status: string): string {
        switch (status) {
            case 'DRAFT': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            case 'SUBMITTED': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'REVIEWED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
    getGoalStatusClass(status: string): string {
        switch (status) {
            case 'NOT_STARTED': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
            case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'HIGH': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'LOW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    }
    getProgressColor(progress: number): string {
        if (progress >= 80) return '#10b981';
        if (progress >= 50) return '#3b82f6';
        if (progress >= 20) return '#f59e0b';
        return '#64748b';
    }
    formatStatus(status: string): string {
        return status.replace(/_/g, ' ');
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
    formatDateTime(value: any): string {
        if (!value) return '';
        try {
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    }
    getRatingStars(rating: number | null): string {
        if (!rating) return '—';
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    }
    hasError(form: FormGroup, field: string): boolean {
        const c = form.get(field);
        return !!(c && c.invalid && c.touched);
    }
    getError(form: FormGroup, field: string): string {
        const c = form.get(field);
        if (!c || !c.errors) return '';
        if (c.errors['required']) return 'Required';
        if (c.errors['min']) return `Min ${c.errors['min'].min}`;
        if (c.errors['max']) return `Max ${c.errors['max'].max}`;
        return 'Invalid';
    }
    private showToast(msg: string): void {
        this.success.set(msg);
        setTimeout(() => this.success.set(''), 3000);
    }
}
