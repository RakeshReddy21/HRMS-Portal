import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';

export interface Notification {
    notificationId: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    referenceId?: number;
    referenceType?: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly baseUrl = `${environment.apiUrl}/notifications`;

    constructor(private http: HttpClient) {}

    getNotifications(
        isRead?: boolean,
        page = 0,
        size = 20
    ): Observable<ApiResponse<PageResponse<Notification>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        if (isRead !== undefined) {
            params = params.set('isRead', isRead.toString());
        }
        return this.http.get<ApiResponse<PageResponse<Notification>>>(
            this.baseUrl,
            { params }
        );
    }

    getUnreadCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(
            `${this.baseUrl}/unread-count`
        );
    }

    markAsRead(notificationId: number): Observable<ApiResponse<Notification>> {
        return this.http.patch<ApiResponse<Notification>>(
            `${this.baseUrl}/${notificationId}/read`,
            {}
        );
    }

    markAllAsRead(): Observable<ApiResponse<{ count: number }>> {
        return this.http.patch<ApiResponse<{ count: number }>>(
            `${this.baseUrl}/read-all`,
            {}
        );
    }
}

