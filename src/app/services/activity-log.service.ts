import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { ActivityLog } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
    private readonly apiUrl = `${environment.apiUrl}/admin/activity-logs`;

    constructor(private http: HttpClient) {}

    getAll(page = 0, size = 20): Observable<ApiResponse<PageResponse<ActivityLog>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<ActivityLog>>>(this.apiUrl, { params });
    }

    getByEntityType(entityType: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<ActivityLog>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<ActivityLog>>>(
            `${this.apiUrl}/entity-type/${entityType}`,
            { params }
        );
    }

    getByEmployee(employeeId: number, page = 0, size = 20): Observable<ApiResponse<PageResponse<ActivityLog>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<ActivityLog>>>(
            `${this.apiUrl}/employee/${employeeId}`,
            { params }
        );
    }

    getByDateRange(startDate: string, endDate: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<ActivityLog>>> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<ActivityLog>>>(
            `${this.apiUrl}/date-range`,
            { params }
        );
    }
}

