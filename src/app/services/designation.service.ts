import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Designation } from '../models/employee.model';
import { DesignationRequest } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DesignationService {
    private readonly apiUrl = `${environment.apiUrl}/admin/designations`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ApiResponse<Designation[]>> {
        return this.http.get<ApiResponse<Designation[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<Designation>> {
        return this.http.get<ApiResponse<Designation>>(`${this.apiUrl}/${id}`);
    }

    create(request: DesignationRequest): Observable<ApiResponse<Designation>> {
        return this.http.post<ApiResponse<Designation>>(this.apiUrl, request);
    }

    update(id: number, request: DesignationRequest): Observable<ApiResponse<Designation>> {
        return this.http.put<ApiResponse<Designation>>(`${this.apiUrl}/${id}`, request);
    }

    activate(id: number): Observable<ApiResponse<Designation>> {
        return this.http.patch<ApiResponse<Designation>>(`${this.apiUrl}/${id}/activate`, {});
    }

    deactivate(id: number): Observable<ApiResponse<Designation>> {
        return this.http.patch<ApiResponse<Designation>>(`${this.apiUrl}/${id}/deactivate`, {});
    }
}

