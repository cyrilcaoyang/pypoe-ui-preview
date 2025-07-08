export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  bot_name?: string;
}

export interface Conversation {
  id: string;
  title: string;
  bot_name: string;
  created_at: string;
  updated_at?: string;
  message_count?: number;
  last_message?: Message;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
}

export interface ConversationStats {
  total_conversations: number;
  total_messages: number;
  total_words: number;
  bot_usage: Record<string, number>;
  avg_messages_per_conversation: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version?: string;
  error?: string;
}

class PyPoeAPI {
  private baseURL: string;
  private credentials?: string;

  constructor(baseURL?: string, credentials?: string) {
    // Auto-detect backend URL based on environment
    this.baseURL = baseURL || this.detectBackendURL();
    this.credentials = credentials;
  }

  private detectBackendURL(): string {
    // Allow override via environment variable
    if (import.meta.env.VITE_PYPOE_BACKEND_URL) {
      return import.meta.env.VITE_PYPOE_BACKEND_URL;
    }

    // Auto-detect based on current host
    const currentHost = window.location.hostname;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      // Local development - try Tailscale IP first, then localhost
      return 'http://100.64.254.6:8000';
    } else {
      // Running on server - assume backend is on same host
      return `http://${currentHost}:8000`;
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.credentials) {
      defaultHeaders['Authorization'] = `Basic ${this.credentials}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async getHealthStatus(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health');
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/conversations');
  }

  async createConversation(title: string, botName: string): Promise<{ conversation_id: string }> {
    return this.request<{ conversation_id: string }>('/api/conversation/new', {
      method: 'POST',
      body: JSON.stringify({ title, bot_name: botName }),
    });
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/conversation/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async searchConversations(query?: string, bot?: string, limit?: number): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (bot) params.append('bot', bot);
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/conversations/search${params.toString() ? '?' + params.toString() : ''}`;
    return this.request<Conversation[]>(endpoint);
  }

  // Messages
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/api/conversation/${conversationId}/messages`);
  }

  async sendMessage(
    conversationId: string, 
    message: string, 
    botName?: string
  ): Promise<{ message: string; role: string; bot_name: string; conversation_id: string }> {
    return this.request(`/api/conversation/${conversationId}/send`, {
      method: 'POST',
      body: JSON.stringify({ message, bot_name: botName }),
    });
  }

  // Bots
  async getAvailableBots(): Promise<string[]> {
    return this.request<string[]>('/api/bots');
  }

  // Stats
  async getStats(): Promise<ConversationStats> {
    return this.request<ConversationStats>('/api/stats');
  }

  // WebSocket connection for real-time chat
  connectWebSocket(
    conversationId: string,
    onMessage: (message: any) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): WebSocket {
    const wsURL = this.baseURL.replace('http', 'ws') + `/ws/chat/${conversationId}`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (onClose) onClose(event);
    };

    return ws;
  }

  // Send message via WebSocket
  sendWebSocketMessage(ws: WebSocket, message: string, botName?: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        message,
        bot_name: botName || 'GPT-3.5-Turbo'
      }));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }
}

// Create singleton instance - will auto-detect backend URL
// Configure authentication credentials from environment variables
// Set VITE_PYPOE_USERNAME and VITE_PYPOE_PASSWORD in .env.local (not committed to git)
const username = import.meta.env.VITE_PYPOE_USERNAME;
const password = import.meta.env.VITE_PYPOE_PASSWORD;

if (!username || !password) {
  console.warn('PyPoe authentication credentials not found. Please set VITE_PYPOE_USERNAME and VITE_PYPOE_PASSWORD in .env.local');
}

const credentials = username && password ? btoa(`${username}:${password}`) : undefined;
export const pyPoeAPI = new PyPoeAPI(undefined, credentials);

// Helper function to create API client with custom backend URL
export const createPyPoeAPI = (backendURL: string, credentials?: string) => {
  return new PyPoeAPI(backendURL, credentials);
};

export default PyPoeAPI; 