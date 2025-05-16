import { ConversationMessage, Conversation } from '@/types/db';

async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else {
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(normalizedEndpoint, baseUrl);

  if ((!options?.method || options.method === 'GET') && params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const fetchOptions: RequestInit = {
    ...options,
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  };

  if (params && options?.method && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(params);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function saveConversation(conversationId: string, messages: ConversationMessage[], completed: boolean = false) {
  try {
    await fetchApi('/api/conversations', {
      conversationId,
      messages,
      completed
    }, { method: 'POST' });
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

async function getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
  try {
    const conversation = await fetchApi<Conversation>('/api/ai-function-call', { conversationId });
    return conversation?.messages || [];
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

export async function getIncompleteConversation() {
  return fetchApi<Conversation | null>('/api/conversations', { completed: false, newest: true });
}

export async function getPreviousMessages(limit = 10) {
  const conversations = await fetchApi<Conversation[]>('/api/conversations', {
    completed: true,
    limit
  });

  return conversations
    .map(conv => conv.messages[conv.messages.length - 1])
    .filter(Boolean);
}