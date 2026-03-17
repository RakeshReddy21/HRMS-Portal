export interface Conversation {
    conversationId: number;
    otherParticipantId: number;
    otherParticipantEmail: string;
    otherParticipantName: string;
    otherParticipantDesignation: string;
    otherParticipantCode: string;
    otherParticipantRole: string;
    otherParticipantDepartment: string;
    lastMessageText: string | null;
    lastSenderId: number | null;
    lastMessageAt: string | null;
    unreadCount: number;
    online: boolean;
}

export interface ChatMessage {
    messageId: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderCode: string;
    recipientId: number;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    fileUrl: string | null;
    fileName: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface ChatMessageRequest {
    conversationId?: number;
    recipientId?: number;
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
}

export interface TypingIndicator {
    conversationId: number;
    senderId: number;
    senderName: string;
    typing: boolean;
}

