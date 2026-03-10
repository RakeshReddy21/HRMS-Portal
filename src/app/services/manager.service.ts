import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse, EmployeeProfile } from '../models/employee.model';
import {
    EmployeeDirectoryEntry,
    AttendanceRecord,
    LeaveApplication,
    LeaveActionRequest,
    TeamLeaveCalendarEntry,
    LeaveBalance,
    PerformanceReview,
    ManagerFeedbackRequest,
    Goal,
    ManagerGoalCommentRequest,
    TeamCount
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class ManagerService {
    private readonly baseUrl = `${environment.apiUrl}/manager`;
    constructor(private http: HttpClient) {}

    getTeamMembers(
        page = 0,
        size = 20,
        sortBy = 'firstName',
        direction = 'asc'
    ): Observable<ApiResponse<PageResponse<EmployeeDirectoryEntry>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        return this.http.get<ApiResponse<PageResponse<EmployeeDirectoryEntry>>>(
            `${this.baseUrl}/team`,
            { params }
        );
    }

    getTeamMemberProfile(employeeCode: string): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.get<ApiResponse<EmployeeProfile>>(
            `${this.baseUrl}/team/${employeeCode}`
        );
    }

    getTeamCount(): Observable<ApiResponse<TeamCount>> {
        return this.http.get<ApiResponse<TeamCount>>(
            `${this.baseUrl}/team/count`
        );
    }

    getTeamLeaves(
        status?: string,
        page = 0,
        size = 10,
        sortBy = 'appliedDate',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<LeaveApplication>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<LeaveApplication>>>(
            `${this.baseUrl}/leaves/team`,
            { params }
        );
    }

    actionLeave(leaveId: number, request: LeaveActionRequest): Observable<ApiResponse<LeaveApplication>> {
        return this.http.patch<ApiResponse<LeaveApplication>>(
            `${this.baseUrl}/leaves/${leaveId}/action`,
            request
        );
    }

    getTeamLeaveCalendar(
        startDate?: string,
        endDate?: string
    ): Observable<ApiResponse<TeamLeaveCalendarEntry[]>> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<ApiResponse<TeamLeaveCalendarEntry[]>>(
            `${this.baseUrl}/leaves/team/calendar`,
            { params }
        );
    }

    getTeamMemberBalance(employeeCode: string): Observable<ApiResponse<LeaveBalance[]>> {
        return this.http.get<ApiResponse<LeaveBalance[]>>(
            `${this.baseUrl}/leaves/team/${employeeCode}/balance`
        );
    }

    getTeamAttendanceToday(): Observable<ApiResponse<AttendanceRecord[]>> {
        return this.http.get<ApiResponse<AttendanceRecord[]>>(
            `${this.baseUrl}/attendance/team/today`
        );
    }

    getTeamAttendance(
        startDate?: string,
        endDate?: string
    ): Observable<ApiResponse<AttendanceRecord[]>> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<ApiResponse<AttendanceRecord[]>>(
            `${this.baseUrl}/attendance/team`,
            { params }
        );
    }

    getTeamReviews(
        status?: string,
        page = 0,
        size = 10,
        sortBy = 'submittedDate',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<PerformanceReview>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<PerformanceReview>>>(
            `${this.baseUrl}/reviews`,
            { params }
        );
    }

    getTeamReviewById(reviewId: number): Observable<ApiResponse<PerformanceReview>> {
        return this.http.get<ApiResponse<PerformanceReview>>(
            `${this.baseUrl}/reviews/${reviewId}`
        );
    }

    provideReviewFeedback(reviewId: number, request: ManagerFeedbackRequest): Observable<ApiResponse<PerformanceReview>> {
        return this.http.patch<ApiResponse<PerformanceReview>>(
            `${this.baseUrl}/reviews/${reviewId}/feedback`,
            request
        );
    }

    getTeamGoals(
        page = 0,
        size = 10,
        sortBy = 'createdAt',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<Goal>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        return this.http.get<ApiResponse<PageResponse<Goal>>>(
            `${this.baseUrl}/goals`,
            { params }
        );
    }

    getTeamMemberGoals(
        employeeCode: string,
        page = 0,
        size = 10,
        sortBy = 'createdAt',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<Goal>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        return this.http.get<ApiResponse<PageResponse<Goal>>>(
            `${this.baseUrl}/goals/${employeeCode}`,
            { params }
        );
    }

    commentOnGoal(goalId: number, request: ManagerGoalCommentRequest): Observable<ApiResponse<Goal>> {
        return this.http.patch<ApiResponse<Goal>>(
            `${this.baseUrl}/goals/${goalId}/comment`,
            request
        );
    }
}
