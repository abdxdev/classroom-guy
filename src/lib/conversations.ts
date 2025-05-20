import { ConversationMessage, Conversation } from '@/types/db';
import { fetchApi } from '@/lib/utils';

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

export async function getIncompleteConversation() {
  return fetchApi<Conversation | null>('/api/conversations', { completed: false, newest: true });
}

export async function getPreviousMessages(limit = 10) {
  try {
    const conversations = await fetchApi<Conversation[]>('/api/conversations', {
      completed: true,
      limit
    });

    if (!conversations || !Array.isArray(conversations)) {
      console.warn('No conversations found or invalid response format');
      return [];
    }

    return conversations
      .map(conv => conv.messages[conv.messages.length - 1])
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to get previous messages:', error);
    return [];
  }
}