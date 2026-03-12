import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Department } from '../models/employee.model';
import { DepartmentRequest } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private readonly apiUrl = `${environment.apiUrl}/admin/departments`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ApiResponse<Department[]>> {
        return this.http.get<ApiResponse<Department[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<Department>> {
        return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/${id}`);
    }

    create(request: DepartmentRequest): Observable<ApiResponse<Department>> {
        return this.http.post<ApiResponse<Department>>(this.apiUrl, request);
    }

    update(id: number, request: DepartmentRequest): Observable<ApiResponse<Department>> {
        return this.http.put<ApiResponse<Department>>(`${this.apiUrl}/${id}`, request);
    }

    activate(id: number): Observable<ApiResponse<Department>> {
        return this.http.patch<ApiResponse<Department>>(`${this.apiUrl}/${id}/activate`, {});
    }

    deactivate(id: number): Observable<ApiResponse<Department>> {
        return this.http.patch<ApiResponse<Department>>(`${this.apiUrl}/${id}/deactivate`, {});
    }
}

