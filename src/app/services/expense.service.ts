import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageResponse } from '../models/employee.model';
import {
    Expense, ExpenseRequest, ExpenseActionRequest,
    InvoiceParseResponse, LeaveAnalysisResponse, PerformanceReportResponse
} from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
    private readonly apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) {}

    // ─── Employee Expenses ───
    createExpense(request: ExpenseRequest): Observable<Expense> {
        return this.http.post<Expense>(`${this.apiUrl}/employee/expenses`, request);
    }

    submitExpense(id: number): Observable<Expense> {
        return this.http.patch<Expense>(`${this.apiUrl}/employee/expenses/${id}/submit`, {});
    }

    getMyExpenses(page = 0, size = 10): Observable<PageResponse<Expense>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/employee/expenses`, { params });
    }

    getExpense(id: number): Observable<Expense> {
        return this.http.get<Expense>(`${this.apiUrl}/employee/expenses/${id}`);
    }

    // ─── AI Invoice Parser ───
    parseInvoice(invoiceText: string): Observable<InvoiceParseResponse> {
        return this.http.post<InvoiceParseResponse>(`${this.apiUrl}/employee/expenses/parse-invoice`, { invoiceText });
    }

    parseFile(fileData: string, fileType: string): Observable<InvoiceParseResponse> {
        console.log('[ExpenseService] parseFile called, fileType:', fileType, 'dataLength:', fileData?.length);
        return this.http.post<InvoiceParseResponse>(
            `${this.apiUrl}/employee/expenses/parse-file`,
            { fileData, fileType }
        ).pipe(timeout(90000)); // 90s timeout — regex is instant, only AI fallback takes time
    }

    // ─── Manager Expenses ───
    getTeamExpenses(page = 0, size = 10): Observable<PageResponse<Expense>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/manager/expenses`, { params });
    }

    managerAction(id: number, request: ExpenseActionRequest): Observable<Expense> {
        return this.http.patch<Expense>(`${this.apiUrl}/manager/expenses/${id}/action`, request);
    }

    // ─── Finance Manager: All Expenses (accessible by MANAGER + ADMIN) ───
    getManagerAllExpenses(status?: string, page = 0, size = 10): Observable<PageResponse<Expense>> {
        let params = new HttpParams().set('page', page).set('size', size);
        if (status) params = params.set('status', status);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/manager/expenses/all`, { params });
    }

    getManagerFinancePending(page = 0, size = 10): Observable<PageResponse<Expense>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/manager/expenses/finance-pending`, { params });
    }

    managerFinanceAction(id: number, request: ExpenseActionRequest): Observable<Expense> {
        return this.http.patch<Expense>(`${this.apiUrl}/manager/expenses/${id}/finance-action`, request);
    }

    // ─── Admin/Finance Expenses ───
    getAllExpenses(status?: string, page = 0, size = 10): Observable<PageResponse<Expense>> {
        let params = new HttpParams().set('page', page).set('size', size);
        if (status) params = params.set('status', status);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/admin/expenses`, { params });
    }

    getFinancePending(page = 0, size = 10): Observable<PageResponse<Expense>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<Expense>>(`${this.apiUrl}/admin/expenses/finance-pending`, { params });
    }

    financeAction(id: number, request: ExpenseActionRequest): Observable<Expense> {
        return this.http.patch<Expense>(`${this.apiUrl}/admin/expenses/${id}/finance-action`, request);
    }

    // ─── AI Leave Reviewer ───
    analyzeLeave(leaveId: number): Observable<LeaveAnalysisResponse> {
        return this.http.get<LeaveAnalysisResponse>(`${this.apiUrl}/manager/leave-analysis/${leaveId}`)
            .pipe(timeout(60000)); // 60s timeout for AI analysis
    }

    // ─── AI Report Generator ───
    generateReport(employeeId: number, period?: string): Observable<PerformanceReportResponse> {
        let params = new HttpParams();
        if (period) params = params.set('period', period);
        return this.http.get<PerformanceReportResponse>(`${this.apiUrl}/admin/reports/performance/${employeeId}`, { params })
            .pipe(timeout(60000)); // 60s timeout for AI report
    }
}

