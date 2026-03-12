import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { IpRangeRequest, IpRangeResponse } from '../models/ip-access.model';

@Injectable({ providedIn: 'root' })
export class IpAccessService {
    private readonly apiUrl = `${environment.apiUrl}/admin/ip-access`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ApiResponse<IpRangeResponse[]>> {
        return this.http.get<ApiResponse<IpRangeResponse[]>>(this.apiUrl);
    }

    getMyIp(): Observable<ApiResponse<string>> {
        return this.http.get<ApiResponse<string>>(`${this.apiUrl}/my-ip`);
    }

    add(request: IpRangeRequest): Observable<ApiResponse<IpRangeResponse>> {
        return this.http.post<ApiResponse<IpRangeResponse>>(this.apiUrl, request);
    }

    update(id: number, request: IpRangeRequest): Observable<ApiResponse<IpRangeResponse>> {
        return this.http.put<ApiResponse<IpRangeResponse>>(`${this.apiUrl}/${id}`, request);
    }

    toggle(id: number): Observable<ApiResponse<IpRangeResponse>> {
        return this.http.patch<ApiResponse<IpRangeResponse>>(`${this.apiUrl}/${id}/toggle`, {});
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }

    checkIp(ip: string): Observable<ApiResponse<boolean>> {
        return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check`, {
            params: { ip }
        });
    }
}
