import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { Announcement, DashboardResponse, EmployeeReportResponse, Holiday, LeaveApplication } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly baseUrl = `${environment.apiUrl}/admin/dashboard`;
    private readonly leaveUrl = `${environment.apiUrl}/admin/leaves`;
    private readonly announcementUrl = `${environment.apiUrl}/admin/announcements`;

    constructor(private http: HttpClient) {}

    getDashboardStats(): Observable<ApiResponse<DashboardResponse>> {
        return this.http.get<ApiResponse<DashboardResponse>>(this.baseUrl);
    }

    getEmployeeReport(): Observable<ApiResponse<EmployeeReportResponse>> {
        return this.http.get<ApiResponse<EmployeeReportResponse>>(`${this.baseUrl}/employee-report`);
    }

    getPendingLeaves(page = 0, size = 5): Observable<ApiResponse<PageResponse<LeaveApplication>>> {
        const params = new HttpParams()
            .set('status', 'PENDING')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<LeaveApplication>>>(`${this.leaveUrl}/applications`, { params });
    }

    getApprovedLeaves(page = 0, size = 100): Observable<ApiResponse<PageResponse<LeaveApplication>>> {
        const params = new HttpParams()
            .set('status', 'APPROVED')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<LeaveApplication>>>(`${this.leaveUrl}/applications`, { params });
    }

    getHolidays(year?: number): Observable<ApiResponse<Holiday[]>> {
        let params = new HttpParams();
        if (year) params = params.set('year', year.toString());
        return this.http.get<ApiResponse<Holiday[]>>(`${this.leaveUrl}/holidays`, { params });
    }

    getAnnouncements(page = 0, size = 5): Observable<ApiResponse<PageResponse<Announcement>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<Announcement>>>(this.announcementUrl, { params });
    }
}

