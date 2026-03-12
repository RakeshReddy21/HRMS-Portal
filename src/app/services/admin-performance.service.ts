import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { PageResponse } from '../models/employee.model';
import { PerformanceReview, ManagerFeedbackRequest } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class AdminPerformanceService {
    private readonly baseUrl = `${environment.apiUrl}/admin/performance`;

    constructor(private http: HttpClient) {}

    getAllReviews(
        status?: string,
        page = 0,
        size = 10,
        sortBy = 'createdAt',
        direction = 'desc'
    ): Observable<ApiResponse<PageResponse<PerformanceReview>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<PageResponse<PerformanceReview>>>(
            `${this.baseUrl}/reviews`,
            { params }
        );
    }

    getReviewById(reviewId: number): Observable<ApiResponse<PerformanceReview>> {
        return this.http.get<ApiResponse<PerformanceReview>>(
            `${this.baseUrl}/reviews/${reviewId}`
        );
    }

    provideReviewFeedback(reviewId: number, request: ManagerFeedbackRequest): Observable<ApiResponse<PerformanceReview>> {
        return this.http.patch<ApiResponse<PerformanceReview>>(
            `${this.baseUrl}/reviews/${reviewId}/feedback`,
            request
        );
    }
}

