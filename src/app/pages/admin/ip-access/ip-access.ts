import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IpAccessService } from '../../../services/ip-access.service';
import { IpRangeResponse } from '../../../models/ip-access.model';

@Component({
    selector: 'app-ip-access',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './ip-access.html',
    styleUrl: './ip-access.css',
})
export class IpAccess implements OnInit {
    ipRanges = signal<IpRangeResponse[]>([]);
    loading = signal(true);
    error = signal('');
    success = signal('');
    myIp = signal('');
    showModal = signal(false);
    editing = signal<IpRangeResponse | null>(null);
    saving = signal(false);
    form!: FormGroup;
    deleteTarget = signal<IpRangeResponse | null>(null);
    showDeleteConfirm = signal(false);
    deleting = signal(false);

    // ── IP Test ──
    testIp = signal('');
    testResult = signal<{ checked: boolean; allowed: boolean } | null>(null);
    testing = signal(false);

    skeletonRows = Array(4).fill(0);

    constructor(
        private ipService: IpAccessService,
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadAll();
    }

    private initForm(): void {
        this.form = this.fb.group({
            ipRange: ['', [Validators.required, Validators.maxLength(50)]],
            description: ['', [Validators.required, Validators.maxLength(200)]],
            isActive: [true],
        });
    }

    // ═══════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════

    loadAll(): void {
        this.loading.set(true);
        this.error.set('');

        this.ipService.getMyIp().subscribe({
            next: (res) => {
                if (res.success && res.data) this.myIp.set(res.data);
            },
            error: () => {}
        });

        this.ipService.getAll().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.ipRanges.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Failed to load IP ranges');
                this.loading.set(false);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // ADD / EDIT MODAL
    // ═══════════════════════════════════════════════════

    openAddModal(): void {
        this.editing.set(null);
        this.form.reset({ ipRange: '', description: '', isActive: true });
        this.showModal.set(true);
    }

    openEditModal(item: IpRangeResponse): void {
        this.editing.set(item);
        this.form.patchValue({
            ipRange: item.ipRange,
            description: item.description,
            isActive: item.isActive,
        });
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.editing.set(null);
        this.form.reset();
    }

    /** Quick button: fills the form with admin's current IP */
    fillMyIp(): void {
        this.form.patchValue({
            ipRange: this.myIp(),
            description: 'My current IP address',
        });
    }

    save(): void {
        if (this.form.invalid) return;
        this.saving.set(true);
        this.error.set('');

        const formData = this.form.value;
        const editing = this.editing();

        const obs = editing
            ? this.ipService.update(editing.ipRangeId, formData)
            : this.ipService.add(formData);

        obs.subscribe({
            next: (res) => {
                if (res.success) {
                    this.success.set(editing ? 'IP range updated successfully' : 'IP range added successfully');
                    this.closeModal();
                    this.loadAll();
                    this.clearSuccess();
                }
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Failed to save IP range');
                this.saving.set(false);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // TOGGLE / DELETE
    // ═══════════════════════════════════════════════════

    toggle(item: IpRangeResponse): void {
        this.ipService.toggle(item.ipRangeId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.success.set(`IP range ${res.data?.isActive ? 'activated' : 'deactivated'}`);
                    this.loadAll();
                    this.clearSuccess();
                }
            },
            error: (err) => this.error.set(err?.error?.message || 'Failed to toggle IP range')
        });
    }

    confirmDelete(item: IpRangeResponse): void {
        this.deleteTarget.set(item);
        this.showDeleteConfirm.set(true);
    }

    cancelDelete(): void {
        this.deleteTarget.set(null);
        this.showDeleteConfirm.set(false);
    }

    doDelete(): void {
        const target = this.deleteTarget();
        if (!target) return;
        this.deleting.set(true);

        this.ipService.delete(target.ipRangeId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.success.set('IP range deleted successfully');
                    this.loadAll();
                    this.clearSuccess();
                }
                this.deleting.set(false);
                this.cancelDelete();
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Failed to delete IP range');
                this.deleting.set(false);
                this.cancelDelete();
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // IP TEST
    // ═══════════════════════════════════════════════════

    onTestIpChange(event: Event): void {
        this.testIp.set((event.target as HTMLInputElement).value);
        this.testResult.set(null);
    }

    checkTestIp(): void {
        const ip = this.testIp().trim();
        if (!ip) return;
        this.testing.set(true);
        this.testResult.set(null);

        this.ipService.checkIp(ip).subscribe({
            next: (res) => {
                this.testResult.set({ checked: true, allowed: !!res.data });
                this.testing.set(false);
            },
            error: () => {
                this.testResult.set({ checked: true, allowed: false });
                this.testing.set(false);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    get activeCount(): number {
        return this.ipRanges().filter(r => r.isActive).length;
    }

    get totalCount(): number {
        return this.ipRanges().length;
    }

    formatDate(date: string): string {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return date;
        }
    }

    private clearSuccess(): void {
        setTimeout(() => this.success.set(''), 3000);
    }
}

