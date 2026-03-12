import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { AIChatRequest, AIChatResponse } from '../models/ai-chat.model';

@Injectable({ providedIn: 'root' })
export class AIChatService {
    private readonly baseUrl = `${environment.apiUrl}/ai`;

    constructor(private http: HttpClient) {}

    sendMessage(request: AIChatRequest): Observable<ApiResponse<AIChatResponse>> {
        return this.http.post<ApiResponse<AIChatResponse>>(
            `${this.baseUrl}/chat`, request
        );
    }
}

