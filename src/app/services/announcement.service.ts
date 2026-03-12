import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { Announcement, AnnouncementRequest } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private readonly apiUrl = `${environment.apiUrl}/admin/announcements`;

    constructor(private http: HttpClient) {}

    getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<Announcement>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<Announcement>>>(this.apiUrl, { params });
    }

    create(request: AnnouncementRequest): Observable<ApiResponse<Announcement>> {
        return this.http.post<ApiResponse<Announcement>>(this.apiUrl, request);
    }

    update(id: number, request: AnnouncementRequest): Observable<ApiResponse<Announcement>> {
        return this.http.put<ApiResponse<Announcement>>(`${this.apiUrl}/${id}`, request);
    }

    activate(id: number): Observable<ApiResponse<Announcement>> {
        return this.http.patch<ApiResponse<Announcement>>(`${this.apiUrl}/${id}/activate`, {});
    }

    deactivate(id: number): Observable<ApiResponse<Announcement>> {
        return this.http.patch<ApiResponse<Announcement>>(`${this.apiUrl}/${id}/deactivate`, {});
    }
}

