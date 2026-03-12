export interface AIChatRequest {
    message: string;
    history?: ChatHistoryEntry[];
}

export interface ChatHistoryEntry {
    role: 'user' | 'assistant';
    content: string;
}

export interface AIChatResponse {
    reply: string;
    action: string | null;
    actionData: any;
    actionPerformed: boolean;
    quickReplies?: string[];
}

export interface AIChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    action?: string | null;
    actionPerformed?: boolean;
    loading?: boolean;
    quickReplies?: string[];
}
