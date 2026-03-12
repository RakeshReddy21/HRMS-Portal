import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { AttendanceRecord, AttendanceSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private readonly apiUrl = `${environment.apiUrl}/admin/attendance`;

    constructor(private http: HttpClient) {}

    getAll(
        date?: string,
        page = 0,
        size = 20,
        sortBy = 'attendanceDate',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<AttendanceRecord>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (date) params = params.set('date', date);
        return this.http.get<ApiResponse<PageResponse<AttendanceRecord>>>(this.apiUrl, { params });
    }

    getEmployeeSummary(
        employeeCode: string,
        month?: number,
        year?: number
    ): Observable<ApiResponse<AttendanceSummary>> {
        let params = new HttpParams();
        if (month != null) params = params.set('month', month.toString());
        if (year != null) params = params.set('year', year.toString());
        return this.http.get<ApiResponse<AttendanceSummary>>(
            `${this.apiUrl}/${employeeCode}/summary`,
            { params }
        );
    }
}

