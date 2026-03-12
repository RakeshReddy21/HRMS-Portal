import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnnouncementService } from '../../../services/announcement.service';
import { Announcement, AnnouncementRequest } from '../../../models/dashboard.model';

@Component({
    selector: 'app-announcement-list',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './announcement-list.html',
    styleUrl: './announcement-list.css',
})
export class AnnouncementList implements OnInit {
    announcements = signal<Announcement[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');

    showModal = signal(false);
    editing = signal<Announcement | null>(null);
    saving = signal(false);
    form!: FormGroup;

    page = signal(0);
    pageSize = 10;
    totalPages = signal(0);
    totalElements = signal(0);

    skeletonRows = Array(5).fill(0);

    constructor(
        private announcementService: AnnouncementService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadAnnouncements();
    }

    private initForm(): void {
        this.form = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(200)]],
            content: ['', [Validators.required, Validators.maxLength(2000)]],
        });
    }

    loadAnnouncements(): void {
        this.loading.set(true);
        this.error.set('');
        this.announcementService.getAll(this.page(), this.pageSize).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.announcements.set(res.data.content);
                    this.totalPages.set(res.data.totalPages);
                    this.totalElements.set(res.data.totalElements);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Failed to load announcements');
                this.loading.set(false);
            }
        });
    }

    goToPage(p: number): void {
        if (p >= 0 && p < this.totalPages()) {
            this.page.set(p);
            this.loadAnnouncements();
        }
    }

    openCreate(): void {
        this.editing.set(null);
        this.form.reset();
        this.showModal.set(true);
    }

    openEdit(ann: Announcement): void {
        this.editing.set(ann);
        this.form.patchValue({
            title: ann.title,
            content: ann.content,
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
        const raw = this.form.getRawValue();
        const request: AnnouncementRequest = {
            title: raw.title,
            content: raw.content,
        };
        const edit = this.editing();

        const action$ = edit
            ? this.announcementService.update(edit.announcementId, request)
            : this.announcementService.create(request);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(edit ? 'Announcement updated' : 'Announcement created');
                    this.closeModal();
                    this.loadAnnouncements();
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Operation failed');
                this.saving.set(false);
            }
        });
    }

    toggleStatus(ann: Announcement): void {
        const action$ = ann.isActive
            ? this.announcementService.deactivate(ann.announcementId)
            : this.announcementService.activate(ann.announcementId);

        action$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.showToast(ann.isActive ? 'Announcement deactivated' : 'Announcement activated');
                    this.loadAnnouncements();
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

    formatDate(value: any): string {
        if (!value) return '';
        const str = typeof value === 'string' ? value.split('T')[0]
            : Array.isArray(value) ? `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`
            : '';
        if (!str) return '';
        const date = new Date(str + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    get activeCount(): number {
        return this.announcements().filter(a => a.isActive).length;
    }
}

