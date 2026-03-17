import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Conversation, ChatMessage } from '../models/chat.model';
import { PageResponse } from '../models/employee.model';
@Injectable({ providedIn: 'root' })
export class ChatService {
    private readonly baseUrl = `${environment.apiUrl}/chat`;
    constructor(private http: HttpClient) {}
    getConversations(): Observable<ApiResponse<Conversation[]>> {
        return this.http.get<ApiResponse<Conversation[]>>(`${this.baseUrl}/conversations`);
    }
    getOrCreateConversation(otherEmployeeId: number): Observable<ApiResponse<Conversation>> {
        return this.http.post<ApiResponse<Conversation>>(
            `${this.baseUrl}/conversations/${otherEmployeeId}`,
            {}
        );
    }
    getMessages(conversationId: number, page = 0, size = 50): Observable<ApiResponse<PageResponse<ChatMessage>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PageResponse<ChatMessage>>>(
            `${this.baseUrl}/conversations/${conversationId}/messages`,
            { params }
        );
    }
    sendMessage(request: {
        conversationId?: number;
        recipientId?: number;
        content: string;
        messageType?: 'TEXT' | 'IMAGE' | 'FILE';
        fileUrl?: string | null;
        fileName?: string | null;
    }): Observable<ApiResponse<ChatMessage>> {
        return this.http.post<ApiResponse<ChatMessage>>(`${this.baseUrl}/messages`, request);
    }
    markConversationAsRead(conversationId: number): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(
            `${this.baseUrl}/conversations/${conversationId}/read`,
            {}
        );
    }
    getUnreadCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.baseUrl}/unread-count`);
    }
    getOnlineUsers(): Observable<ApiResponse<string[]>> {
        return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/online-users`);
    }
}
