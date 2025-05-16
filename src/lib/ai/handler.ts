import { v4 as uuidv4 } from 'uuid';
import { MODEL_NAME, initializeAI } from './config';
import { getToolDefinitions } from './schema';
import { processResponse, FunctionCallResponse } from './response';
import { getIncompleteConversation, getPreviousMessages, saveConversation } from '../conversations';
import type { ConversationMessage } from '@/types/db';

export type HandleCommandResult = {
  status: 'success' | 'error';
  conversationId: string;
  result: {
    text?: string;
    functionResponse?: {
      name: string;
      response: {
        output: string;
        error?: string;
      };
    };
  };
  error?: string;
};

export async function handleCommand(query: string): Promise<HandleCommandResult> {
  console.log('Handling AI command:', query);
  
  const incompleteConversation = await getIncompleteConversation();
  const previousMessages = await getPreviousMessages();
  const conversationId = incompleteConversation?.conversationId || uuidv4();

  const { ai, config } = await initializeAI();
  config.tools = getToolDefinitions();

  let initialHistory: ConversationMessage[];

  if (incompleteConversation) {
    initialHistory = [
      ...previousMessages,
      ...incompleteConversation.messages,
      {
        role: 'user',
        parts: [{ text: query }]
      }
    ];
  } else {
    initialHistory = [
      ...previousMessages,
      {
        role: 'user',
        parts: [{ text: query }]
      }
    ];
  }

  await saveConversation(conversationId, initialHistory);

  const response = await ai.models.generateContent({
    config,
    model: MODEL_NAME,
    contents: initialHistory,
  });

  const result = await processResponse(response, conversationId, initialHistory, ai, config);
  console.log('Final response:', result);

  if (typeof result === 'string') {
    return {
      status: 'success',
      conversationId,
      result: { text: result }
    };
  }

  const functionResponse = result as FunctionCallResponse;
  return {
    status: 'success',
    conversationId,
    result: {
      functionResponse: {
        name: functionResponse.name,
        response: {
          output: functionResponse.response.output || '',
          error: functionResponse.response.error
        }
      }
    }
  };
}