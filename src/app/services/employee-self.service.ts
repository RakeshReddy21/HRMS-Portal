import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse, EmployeeProfile } from '../models/employee.model';
import { EmployeeDashboardResponse, AttendanceRecord, AttendanceSummary, LeaveApplyRequest, LeaveBalance, LeaveType, EmployeeLeaveApplication, Holiday, Announcement, PerformanceReview, PerformanceReviewRequest, Goal, GoalRequest, GoalProgressRequest, EmployeeDirectoryEntry } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class EmployeeSelfService {
    private readonly baseUrl = `${environment.apiUrl}/employees`;
    constructor(private http: HttpClient) {}

    getMyProfile(): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.get<ApiResponse<EmployeeProfile>>(`${this.baseUrl}/me`);
    }
    updateMyProfile(request: any): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.put<ApiResponse<EmployeeProfile>>(`${this.baseUrl}/me`, request);
    }
    changePassword(request: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.baseUrl}/me/change-password`, request);
    }
    getDashboard(): Observable<ApiResponse<EmployeeDashboardResponse>> {
        return this.http.get<ApiResponse<EmployeeDashboardResponse>>(`${this.baseUrl}/dashboard`);
    }
    checkIn(body?: { notes?: string }): Observable<ApiResponse<AttendanceRecord>> {
        return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/check-in`, body ?? {});
    }
    checkOut(body?: { notes?: string }): Observable<ApiResponse<AttendanceRecord>> {
        return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/check-out`, body ?? {});
    }
    getTodayAttendance(): Observable<ApiResponse<AttendanceRecord>> {
        return this.http.get<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/today`);
    }
    getAttendanceHistory(startDate?: string, endDate?: string, page = 0, size = 10, sortBy = 'attendanceDate', direction = 'desc'): Observable<ApiResponse<PageResponse<AttendanceRecord>>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<ApiResponse<PageResponse<AttendanceRecord>>>(`${this.baseUrl}/attendance/history`, { params });
    }
    getAttendanceSummary(month?: number, year?: number): Observable<ApiResponse<AttendanceSummary>> {
        let params = new HttpParams();
        if (month != null) params = params.set('month', month.toString());
        if (year != null) params = params.set('year', year.toString());
        return this.http.get<ApiResponse<AttendanceSummary>>(`${this.baseUrl}/attendance/summary`, { params });
    }
    applyLeave(request: LeaveApplyRequest): Observable<ApiResponse<EmployeeLeaveApplication>> {
        return this.http.post<ApiResponse<EmployeeLeaveApplication>>(`${this.baseUrl}/leaves/apply`, request);
    }
    getMyLeaves(status?: string, page = 0, size = 10, sortBy = 'appliedDate', direction = 'desc'): Observable<ApiResponse<PageResponse<EmployeeLeaveApplication>>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<EmployeeLeaveApplication>>>(`${this.baseUrl}/leaves`, { params });
    }
    cancelLeave(leaveId: number): Observable<ApiResponse<EmployeeLeaveApplication>> {
        return this.http.patch<ApiResponse<EmployeeLeaveApplication>>(`${this.baseUrl}/leaves/${leaveId}/cancel`, {});
    }
    getLeaveBalance(): Observable<ApiResponse<LeaveBalance[]>> {
        return this.http.get<ApiResponse<LeaveBalance[]>>(`${this.baseUrl}/leaves/balance`);
    }
    getHolidays(year?: number): Observable<ApiResponse<Holiday[]>> {
        let params = new HttpParams();
        if (year != null) params = params.set('year', year.toString());
        return this.http.get<ApiResponse<Holiday[]>>(`${this.baseUrl}/leaves/holidays`, { params });
    }
    getAnnouncements(page = 0, size = 10): Observable<ApiResponse<PageResponse<Announcement>>> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<Announcement>>>(`${this.baseUrl}/announcements`, { params });
    }
    getMyReviews(status?: string, page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<ApiResponse<PageResponse<PerformanceReview>>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<PerformanceReview>>>(`${this.baseUrl}/reviews`, { params });
    }
    getReview(reviewId: number): Observable<ApiResponse<PerformanceReview>> {
        return this.http.get<ApiResponse<PerformanceReview>>(`${this.baseUrl}/reviews/${reviewId}`);
    }
    createReview(request: PerformanceReviewRequest): Observable<ApiResponse<PerformanceReview>> {
        return this.http.post<ApiResponse<PerformanceReview>>(`${this.baseUrl}/reviews`, request);
    }
    updateReview(reviewId: number, request: PerformanceReviewRequest): Observable<ApiResponse<PerformanceReview>> {
        return this.http.put<ApiResponse<PerformanceReview>>(`${this.baseUrl}/reviews/${reviewId}`, request);
    }
    submitReview(reviewId: number): Observable<ApiResponse<PerformanceReview>> {
        return this.http.patch<ApiResponse<PerformanceReview>>(`${this.baseUrl}/reviews/${reviewId}/submit`, {});
    }
    getMyGoals(year?: number, status?: string, page = 0, size = 10, sortBy = 'createdAt', direction = 'desc'): Observable<ApiResponse<PageResponse<Goal>>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if (year != null) params = params.set('year', year.toString());
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<Goal>>>(`${this.baseUrl}/goals`, { params });
    }
    createGoal(request: GoalRequest): Observable<ApiResponse<Goal>> {
        return this.http.post<ApiResponse<Goal>>(`${this.baseUrl}/goals`, request);
    }
    updateGoalProgress(goalId: number, request: GoalProgressRequest): Observable<ApiResponse<Goal>> {
        return this.http.patch<ApiResponse<Goal>>(`${this.baseUrl}/goals/${goalId}/progress`, request);
    }
    searchDirectory(keyword?: string, departmentId?: number, page = 0, size = 20, sortBy = 'firstName', direction = 'asc'): Observable<ApiResponse<PageResponse<EmployeeDirectoryEntry>>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if (keyword) params = params.set('keyword', keyword);
        if (departmentId != null) params = params.set('departmentId', departmentId.toString());
        return this.http.get<ApiResponse<PageResponse<EmployeeDirectoryEntry>>>(`${this.baseUrl}/directory`, { params });
    }
}
