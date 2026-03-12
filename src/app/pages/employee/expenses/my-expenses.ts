import { Component, OnInit } from '@angular/core';
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
    totalPages = 0;
    currentPage = 0;

    categories = EXPENSE_CATEGORIES;
    submitting = false;

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

    constructor(private expenseService: ExpenseService) {}

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
        const reader = new FileReader();
        reader.onload = () => {
            this.fileBase64 = reader.result as string;
            this.filePreviewUrl = file.type.startsWith('image/') ? this.fileBase64 : null;
        };
        reader.readAsDataURL(file);
    }

    removeFile() {
        this.uploadedFile = null;
        this.filePreviewUrl = null;
        this.fileBase64 = null;
        this.aiError = '';
        this.aiSuccess = false;
    }

    // ─── AI Auto-Fill ───
    autoFill() {
        if (!this.fileBase64 || !this.uploadedFile) {
            this.aiError = 'No file uploaded. Please upload a file first.';
            return;
        }

        console.log('[AutoFill] Starting auto-fill...');
        console.log('[AutoFill] File:', this.uploadedFile.name, 'Type:', this.uploadedFile.type, 'Base64 length:', this.fileBase64?.length);

        this.parsing = true;
        this.aiError = '';
        this.aiSuccess = false;

        this.expenseService.parseFile(this.fileBase64, this.uploadedFile.type).subscribe({
            next: (res: InvoiceParseResponse) => {
                console.log('[AutoFill] Response received:', JSON.stringify(res).substring(0, 500));
                this.parsing = false;

                if (res.success) {
                    this.aiSuccess = true;

                    // Fill all fields from response
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

                    console.log('[AutoFill] Fields filled: title=', this.title, 'vendor=', this.vendorName, 'amount=', this.totalAmount);
                } else {
                    console.warn('[AutoFill] Parsing failed:', res.errorMessage);
                    this.aiError = res.errorMessage || 'Could not extract data from the file. Please fill the form manually.';
                }
            },
            error: (err: any) => {
                this.parsing = false;
                console.error('[AutoFill] HTTP Error:', err);
                console.error('[AutoFill] Status:', err.status, 'StatusText:', err.statusText);
                console.error('[AutoFill] Error body:', err.error);

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
            }
        });
    }

    // ─── Submit ───
    submitExpense() {
        if (!this.title || !this.totalAmount) return;
        this.submitting = true;
        const req = this.buildRequest();
        this.expenseService.createExpense(req).subscribe({
            next: (expense) => {
                this.expenseService.submitExpense(expense.expenseId).subscribe({
                    next: () => { this.submitting = false; this.resetForm(); this.loadHistory(); this.view = 'history'; },
                    error: () => { this.submitting = false; this.loadHistory(); }
                });
            },
            error: () => { this.submitting = false; }
        });
    }

    saveDraft() {
        if (!this.title || !this.totalAmount) return;
        this.submitting = true;
        this.expenseService.createExpense(this.buildRequest()).subscribe({
            next: () => { this.submitting = false; this.resetForm(); this.loadHistory(); },
            error: () => { this.submitting = false; }
        });
    }

    submitDraft(id: number) {
        this.expenseService.submitExpense(id).subscribe({ next: () => this.loadHistory() });
    }

    private buildRequest(): ExpenseRequest {
        return {
            title: this.title, vendorName: this.vendorName, invoiceNumber: this.invoiceNumber,
            expenseDate: this.billDate, totalAmount: this.totalAmount || 0, category: this.category,
            description: this.description, items: this.items.length ? this.items : undefined
        };
    }

    loadHistory() {
        this.loadingHistory = true;
        this.expenseService.getMyExpenses(this.currentPage).subscribe({
            next: (res) => { this.expenses = res.content; this.totalPages = res.totalPages; this.loadingHistory = false; },
            error: () => { this.loadingHistory = false; }
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
}
