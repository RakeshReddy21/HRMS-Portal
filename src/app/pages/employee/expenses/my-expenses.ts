import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseRequest, InvoiceParseResponse, EXPENSE_CATEGORIES } from '../../../models/expense.model';

@Component({
    selector: 'app-my-expenses',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-expenses.html',
    styleUrl: './my-expenses.css'
})
export class MyExpenses implements OnInit {
    view: 'form' | 'history' = 'form';

    expenses: Expense[] = [];
    loadingHistory = false;
    historyError = '';
    totalPages = 0;
    currentPage = 0;

    categories = EXPENSE_CATEGORIES;
    submitting = false;
    submitError = '';

    // Form
    title = '';
    vendorName = '';
    invoiceNumber = '';
    billDate = new Date().toISOString().split('T')[0];
    totalAmount: number | null = null;
    category = 'OTHER';
    description = '';
    items: { description: string; amount: number; quantity: number }[] = [];

    // File
    uploadedFile: File | null = null;
    filePreviewUrl: string | null = null;
    fileBase64: string | null = null;

    // AI
    parsing = false;
    aiError = '';
    aiSuccess = false;
    parseStep: 'idle' | 'reading' | 'extracting' | 'filling' | 'done' = 'idle';

    constructor(private expenseService: ExpenseService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

    ngOnInit() { this.loadHistory(); }

    // ─── File ───
    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) this.processFile(input.files[0]);
    }
    onDrop(event: DragEvent) { event.preventDefault(); if (event.dataTransfer?.files?.length) this.processFile(event.dataTransfer.files[0]); }
    onDragOver(event: DragEvent) { event.preventDefault(); }

    private processFile(file: File) {
        this.uploadedFile = file;
        this.aiError = '';
        this.aiSuccess = false;
        this.parseStep = 'reading';
        const reader = new FileReader();
        reader.onload = () => {
            // ★ FIX: FileReader.onload runs outside Angular zone — wrap in zone.run()
            // Without this, UI won't update until user clicks somewhere on the page
            this.zone.run(() => {
                this.fileBase64 = reader.result as string;
                this.filePreviewUrl = file.type.startsWith('image/') ? this.fileBase64 : null;
                this.cdr.detectChanges();
                // Auto-trigger AI parsing immediately
                this.autoFill();
            });
        };
        reader.readAsDataURL(file);
    }

    removeFile() {
        this.uploadedFile = null;
        this.filePreviewUrl = null;
        this.fileBase64 = null;
        this.aiError = '';
        this.aiSuccess = false;
        this.parseStep = 'idle';
    }

    // ─── AI Auto-Fill (optimized for speed) ───
    autoFill() {
        if (!this.fileBase64 || !this.uploadedFile) {
            this.aiError = 'No file uploaded. Please upload a file first.';
            return;
        }

        console.log('[AutoFill] Starting auto-fill...');
        console.log('[AutoFill] File:', this.uploadedFile.name, 'Type:', this.uploadedFile.type, 'Base64 length:', this.fileBase64?.length);

        this.parsing = true;
        this.parseStep = 'extracting';
        this.aiError = '';
        this.aiSuccess = false;

        this.expenseService.parseFile(this.fileBase64, this.uploadedFile.type).subscribe({
            next: (res: InvoiceParseResponse) => {
                console.log('[AutoFill] Response received:', JSON.stringify(res).substring(0, 500));
                this.parseStep = 'filling';

                if (res.success) {
                    this.fillFields(res);
                    this.aiSuccess = true;
                    this.parseStep = 'done';
                    this.parsing = false;
                    console.log('[AutoFill] Fields filled: title=', this.title, 'vendor=', this.vendorName, 'amount=', this.totalAmount);
                } else {
                    this.parsing = false;
                    this.parseStep = 'idle';
                    console.warn('[AutoFill] Parsing failed:', res.errorMessage);
                    this.aiError = res.errorMessage || 'Could not extract data from the file. Please fill the form manually.';
                }
                this.cdr.detectChanges(); // ★ Force UI update
            },
            error: (err: any) => {
                this.parsing = false;
                this.parseStep = 'idle';
                console.error('[AutoFill] HTTP Error:', err);

                if (err.name === 'TimeoutError') {
                    this.aiError = 'Request timed out. The server is taking too long to process the file.';
                } else if (err.status === 0) {
                    this.aiError = 'Cannot reach the backend server (port 8080). Make sure it is running.';
                } else if (err.status === 401 || err.status === 403) {
                    this.aiError = 'Session expired. Please refresh the page and log in again.';
                } else if (err.status === 413) {
                    this.aiError = 'File too large. Please upload a smaller file.';
                } else {
                    this.aiError = 'Error ' + (err.status || '') + ': ' + (err.error?.message || err.statusText || 'Unknown error');
                }
                this.cdr.detectChanges(); // ★ Force UI update
            }
        });
    }

    /** Fill all form fields from parsed response in a single pass */
    private fillFields(res: InvoiceParseResponse) {
        if (res.title) this.title = res.title;
        if (res.vendorName) this.vendorName = res.vendorName;
        if (res.invoiceNumber) this.invoiceNumber = res.invoiceNumber;
        if (res.totalAmount != null && res.totalAmount > 0) this.totalAmount = res.totalAmount;
        if (res.category && res.category !== 'OTHER') this.category = res.category;
        if (res.invoiceDate) this.billDate = res.invoiceDate;
        if (res.description) this.description = res.description;
        if (res.items?.length) {
            this.items = res.items.map(i => ({
                description: i.description || '',
                amount: i.amount || 0,
                quantity: i.quantity || 1
            }));
        }

        // Auto-generate title if not provided
        if (!this.title) {
            const parts: string[] = [];
            if (res.vendorName) parts.push(res.vendorName);
            if (res.category && res.category !== 'OTHER') parts.push(this.formatCategory(res.category));
            this.title = parts.length ? parts.join(' — ') : 'Expense';
        }
    }

    // ─── Submit ───
    submitExpense() {
        if (!this.title || !this.totalAmount) return;
        this.submitting = true;
        this.submitError = '';
        const req = this.buildRequest();
        console.log('[Submit] Creating expense:', JSON.stringify(req));
        this.expenseService.createExpense(req).subscribe({
            next: (expense) => {
                console.log('[Submit] Created expense:', expense.expenseId);
                this.expenseService.submitExpense(expense.expenseId).subscribe({
                    next: () => {
                        this.submitting = false;
                        this.currentPage = 0;
                        this.resetForm();
                        this.view = 'history';
                        this.loadHistory();
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        this.submitting = false;
                        this.submitError = 'Failed to submit: ' + (err.error?.message || err.statusText || 'Unknown error');
                        console.error('[Submit] Submit failed:', err);
                        this.loadHistory();
                        this.cdr.detectChanges();
                    }
                });
            },
            error: (err) => {
                this.submitting = false;
                this.submitError = 'Failed to create expense: ' + (err.error?.message || err.statusText || err.message || 'Unknown error');
                console.error('[Submit] Create failed:', err);
                this.cdr.detectChanges();
            }
        });
    }

    saveDraft() {
        if (!this.title || !this.totalAmount) return;
        this.submitting = true;
        this.submitError = '';
        this.expenseService.createExpense(this.buildRequest()).subscribe({
            next: () => {
                this.submitting = false;
                this.currentPage = 0;
                this.resetForm();
                this.loadHistory();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.submitting = false;
                this.submitError = 'Failed to save draft: ' + (err.error?.message || err.statusText || err.message || 'Unknown error');
                console.error('[Draft] Save failed:', err);
                this.cdr.detectChanges();
            }
        });
    }

    submitDraft(id: number) {
        this.expenseService.submitExpense(id).subscribe({ next: () => this.loadHistory() });
    }

    private buildRequest(): ExpenseRequest {
        return {
            title: this.title, vendorName: this.vendorName, invoiceNumber: this.invoiceNumber,
            expenseDate: this.billDate, totalAmount: this.totalAmount || 0, category: this.category,
            description: this.description,
            receiptBase64: this.fileBase64 || undefined,
            receiptFileName: this.uploadedFile?.name || undefined,
            items: this.items.length ? this.items : undefined
        };
    }

    loadHistory() {
        this.loadingHistory = true;
        this.historyError = '';
        this.expenseService.getMyExpenses(this.currentPage).subscribe({
            next: (res) => {
                this.expenses = res.content;
                this.totalPages = res.totalPages;
                this.loadingHistory = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loadingHistory = false;
                this.expenses = [];
                this.historyError = err.error?.message || err.statusText || 'Unable to load expense history.';
                this.cdr.detectChanges();
            }
        });
    }

    resetForm() {
        this.title = ''; this.vendorName = ''; this.invoiceNumber = ''; this.totalAmount = null;
        this.billDate = new Date().toISOString().split('T')[0]; this.category = 'OTHER';
        this.description = ''; this.items = [];
        this.removeFile();
    }

    addItem() { this.items.push({ description: '', amount: 0, quantity: 1 }); }
    removeItem(i: number) { this.items.splice(i, 1); }

    get canSubmit(): boolean { return !!this.title && !!this.totalAmount && this.totalAmount > 0; }

    getStatusColor(s: string): string {
        const c: Record<string, string> = {
            DRAFT: 'bg-gray-500/20 text-gray-400', SUBMITTED: 'bg-blue-500/20 text-blue-400',
            MANAGER_APPROVED: 'bg-yellow-500/20 text-yellow-400', FINANCE_APPROVED: 'bg-emerald-500/20 text-emerald-400',
            REJECTED: 'bg-red-500/20 text-red-400', REIMBURSED: 'bg-green-500/20 text-green-400'
        };
        return c[s] || 'bg-gray-500/20 text-gray-400';
    }

    formatCategory(cat: string): string { return cat?.replace(/_/g, ' ') || ''; }
    formatStatus(s: string): string { return s?.replace(/_/g, ' ') || ''; }

    // ─── Status Step Tracker ───
    readonly expenseSteps = [
        { key: 'DRAFT', label: 'Draft', icon: '📝' },
        { key: 'SUBMITTED', label: 'Submitted', icon: '📤' },
        { key: 'MANAGER_APPROVED', label: 'Manager Approved', icon: '👤' },
        { key: 'FINANCE_APPROVED', label: 'Finance Approved', icon: '🏦' },
        { key: 'REIMBURSED', label: 'Reimbursed', icon: '✅' }
    ];

    getStepIndex(status: string): number {
        const idx = this.expenseSteps.findIndex(s => s.key === status);
        return idx >= 0 ? idx : -1;
    }

    isStepCompleted(status: string, stepKey: string): boolean {
        if (status === 'REJECTED') return false;
        return this.getStepIndex(status) > this.getStepIndex(stepKey);
    }

    isStepActive(status: string, stepKey: string): boolean {
        if (status === 'REJECTED') return false;
        return status === stepKey;
    }

    isRejected(status: string): boolean {
        return status === 'REJECTED';
    }
}
