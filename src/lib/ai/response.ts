import { FunctionCall, FunctionResponse } from '@google/genai';
import * as scheduleLib from '@/lib/modelFunctions';
import { ConversationMessage } from '@/types/db';
import { saveConversation } from '../conversations';

export type FunctionCallResponse = {
  name: string;
  response: {
    output: string;
    error?: string;
  };
};

export async function processResponse(
  aiResponse: any, 
  conversationId: string,
  conversationHistory: ConversationMessage[] = [],
  ai: any,
  config: any
): Promise<string | FunctionResponse> {
  if (!aiResponse.functionCalls?.length) {
    if (aiResponse.text) {
      console.log('AI text response:', aiResponse.text);
      const modelMessage: ConversationMessage = {
        role: 'model',
        parts: [{ text: aiResponse.text }]
      };

      const updatedHistory = [...conversationHistory, modelMessage];
      await saveConversation(conversationId, updatedHistory, true);
      return aiResponse.text;
    }
    const error = 'No response or function call received';
    console.error('AI response error:', error);
    await saveConversation(conversationId, conversationHistory, true);
    return { response: { error } };
  }

  const functionCall = aiResponse.functionCalls[0] as FunctionCall;
  console.log('Function execution details:', {
    name: functionCall.name,
    arguments: functionCall.args,
    timestamp: new Date().toISOString()
  });

  const functionCallMessage: ConversationMessage = {
    role: 'model',
    parts: [{
      functionCall: {
        name: functionCall.name ?? 'unknown',
        args: functionCall.args ?? {}
      }
    }]
  };

  const historyWithCall = [...conversationHistory, functionCallMessage];

  if (functionCall.name === 'ignorePrompt') {
    console.log('Ignoring prompt');
    await saveConversation(conversationId, historyWithCall, true);
    return {
      name: 'ignorePrompt',
      response: { output: '' }
    };
  }

  if (functionCall.name === 'askUser') {
    console.log('Asking user:', functionCall.args?.question);
    await saveConversation(conversationId, historyWithCall, false);
    return {
      name: 'askUser',
      response: { output: functionCall.args?.question as string || 'Can you provide relevant information?' }
    };
  }

  await saveConversation(conversationId, historyWithCall);

  try {
    if (!functionCall.name) {
      throw new Error('Function name is undefined');
    }

    const scheduleFunction = (scheduleLib as any)[functionCall.name];
    if (typeof scheduleFunction !== 'function') {
      throw new Error(`Function ${functionCall.name} is not implemented in schedule library`);
    }

    let args = functionCall.args;
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (e) {
        console.log('Args parsing failed, using as is:', args);
      }
    }

    console.log('Executing function:', {
      name: functionCall.name,
      parsedArguments: args,
      timestamp: new Date().toISOString()
    });

    const functionResult = await scheduleFunction(args);
    const output = typeof functionResult === 'string' ? functionResult : JSON.stringify(functionResult);
    
    console.log('Function execution result:', {
      name: functionCall.name,
      output: output,
      timestamp: new Date().toISOString()
    });

    const functionResponseMessage: ConversationMessage = {
      role: 'function',
      parts: [{
        functionResponse: {
          name: functionCall.name,
          response: { output }
        }
      }]
    };

    const updatedHistory = [...historyWithCall, functionResponseMessage];
    await saveConversation(conversationId, updatedHistory);

    const followupResponse = await ai.models.generateContent({
      config,
      model: 'gemini-2.0-flash',
      contents: updatedHistory,
    });

    return processResponse(followupResponse, conversationId, updatedHistory, ai, config);

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Function execution error:', {
      name: functionCall.name,
      error: error,
      timestamp: new Date().toISOString()
    });

    const errorMessage: ConversationMessage = {
      role: 'function',
      parts: [{
        functionResponse: {
          name: functionCall.name || 'unknown',
          response: {
            output: '',
            error
          }
        }
      }]
    };

    const updatedHistory = [...historyWithCall, errorMessage];
    await saveConversation(conversationId, updatedHistory);

    const errorResponse = await ai.models.generateContent({
      config,
      model: 'gemini-2.0-flash',
      contents: updatedHistory,
    });

    return processResponse(errorResponse, conversationId, updatedHistory, ai, config);
  }
}