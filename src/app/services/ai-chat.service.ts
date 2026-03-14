import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
<<<<<<< HEAD
import { Observable } from 'rxjs';
=======
import { Observable, timeout, catchError, of } from 'rxjs';
>>>>>>> master
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { AIChatRequest, AIChatResponse } from '../models/ai-chat.model';

@Injectable({ providedIn: 'root' })
export class AIChatService {
    private readonly baseUrl = `${environment.apiUrl}/ai`;

    constructor(private http: HttpClient) {}

    sendMessage(request: AIChatRequest): Observable<ApiResponse<AIChatResponse>> {
<<<<<<< HEAD
        return this.http.post<ApiResponse<AIChatResponse>>(
            `${this.baseUrl}/chat`, request
=======
        // Trim history to last 6 entries to keep backend prompt short → faster AI
        const trimmedRequest: AIChatRequest = {
            ...request,
            history: request.history?.slice(-6)
        };

        return this.http.post<ApiResponse<AIChatResponse>>(
            `${this.baseUrl}/chat`, trimmedRequest
        ).pipe(
            timeout(30000), // 30s timeout — fail fast rather than hang
            catchError(() => of({
                success: false,
                message: 'Request timed out',
                data: {
                    reply: 'The AI is taking too long to respond. Please try a simpler query or type "help".',
                    action: null,
                    actionData: null,
                    actionPerformed: false,
                    quickReplies: ['Help', 'My Dashboard']
                }
            } as ApiResponse<AIChatResponse>))
>>>>>>> master
        );
    }
}

