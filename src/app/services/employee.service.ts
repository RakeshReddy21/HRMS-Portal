import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Department, Designation, EmployeeProfile, PageResponse, RegisterEmployeeRequest } from '../models/employee.model';

@Injectable({providedIn: 'root'})
export class EmployeeService{
    private readonly apiUrl = `${environment.apiUrl}/admin/employees`;
    private readonly deptUrl = `${environment.apiUrl}/admin/departments`;
    private readonly desigUrl = `${environment.apiUrl}/admin/designations`;
    constructor(private http: HttpClient){}
    getEmployees(
        keyword?: string, departmentId?: number, role?: string, active?: boolean, page=0, size=12, sortBy = 'employeeId', direction = 'asc' 
    ): Observable<ApiResponse<PageResponse<EmployeeProfile>>>{
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sortBy', sortBy).set('direction', direction);
        if(keyword) params = params.set('keyword', keyword);
        if (departmentId !== undefined && departmentId !== null) params = params.set('departmentId', departmentId.toString());
        if (role) params = params.set('role', role);
        if (active !== undefined && active !== null) params = params.set('active', active.toString());
        return this.http.get<ApiResponse<PageResponse<EmployeeProfile>>>(this.apiUrl, { params });
    }
    getEmployee(employeeCode: string): Observable<ApiResponse<EmployeeProfile>>{
        return this.http.get<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/${employeeCode}`);
    }
    registerEmployee(request: RegisterEmployeeRequest): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.post<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/register`, request);
    }
    updateEmployee(employeeCode: string, request: any): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.put<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/${employeeCode}`, request);
    }
    assignManager(employeeCode: string, managerCode: string): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.patch<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/${employeeCode}/manager`, { managerCode });
    }
    deactivateEmployee(employeeCode: string): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.patch<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/${employeeCode}/deactivate`, {});
    }
    activateEmployee(employeeCode: string): Observable<ApiResponse<EmployeeProfile>> {
        return this.http.patch<ApiResponse<EmployeeProfile>>(`${this.apiUrl}/${employeeCode}/activate`, {});
    }
    resetPassword(employeeCode: string, newPassword: string): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(`${this.apiUrl}/${employeeCode}/reset-password`, { newPassword });
    }
    getDepartments(): Observable<ApiResponse<Department[]>> {
        return this.http.get<ApiResponse<Department[]>>(this.deptUrl);
    }
    getDesignations(): Observable<ApiResponse<Designation[]>> {
        return this.http.get<ApiResponse<Designation[]>>(this.desigUrl);
    }
}