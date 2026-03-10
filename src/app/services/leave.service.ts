import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { Holiday, HolidayRequest, LeaveActionRequest, LeaveApplication, LeaveType, LeaveTypeRequest } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class LeaveService {
    private readonly apiUrl = `${environment.apiUrl}/admin/leaves`;
    constructor(private http: HttpClient) {}

    getApplications(status?: string, page = 0, size = 10, sortBy = 'appliedDate', direction = 'desc'): Observable<ApiResponse<PageResponse<LeaveApplication>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<LeaveApplication>>>(`${this.apiUrl}/applications`, { params });
    }

    actionLeave(leaveId: number, request: LeaveActionRequest): Observable<ApiResponse<LeaveApplication>> {
        return this.http.patch<ApiResponse<LeaveApplication>>(`${this.apiUrl}/${leaveId}/action`, request);
    }

    getLeaveTypes(): Observable<ApiResponse<LeaveType[]>> {
        return this.http.get<ApiResponse<LeaveType[]>>(`${this.apiUrl}/types`);
    }

    createLeaveType(request: LeaveTypeRequest): Observable<ApiResponse<LeaveType>> {
        return this.http.post<ApiResponse<LeaveType>>(`${this.apiUrl}/types`, request);
    }

    updateLeaveType(id: number, request: LeaveTypeRequest): Observable<ApiResponse<LeaveType>> {
        return this.http.put<ApiResponse<LeaveType>>(`${this.apiUrl}/types/${id}`, request);
    }

    getHolidays(year?: number): Observable<ApiResponse<Holiday[]>> {
        let params = new HttpParams();
        if (year) params = params.set('year', year.toString());
        return this.http.get<ApiResponse<Holiday[]>>(`${this.apiUrl}/holidays`, { params });
    }

    createHoliday(request: HolidayRequest): Observable<ApiResponse<Holiday>> {
        return this.http.post<ApiResponse<Holiday>>(`${this.apiUrl}/holidays`, request);
    }

    updateHoliday(id: number, request: HolidayRequest): Observable<ApiResponse<Holiday>> {
        return this.http.put<ApiResponse<Holiday>>(`${this.apiUrl}/holidays/${id}`, request);
    }

    deleteHoliday(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/holidays/${id}`);
    }
}
