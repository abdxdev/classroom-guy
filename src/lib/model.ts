import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  GenerateContentConfig,
  Tool,
  Type,
  FunctionResponse,
  FunctionCall,
} from '@google/genai';
import * as scheduleLib from '@/lib/modelFunctions';
import { readFileSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import functionDeclarations from '@/data/functionDeclarations.json';
import { getCollection, serializeDocument } from './db';
import { ConversationMessage, Conversation, SYSTEM_USER_ID, SYSTEM_STUDENT_ID } from '@/types/db';

const systemInstruction = readFileSync(path.join(process.cwd(), 'src/data/systemInstructions.md'), 'utf-8');

async function saveConversation(conversationId: string, messages: ConversationMessage[], completed: boolean = false) {
  try {
    const collection = await getCollection('conversations');
    const now = new Date();
    
    await collection.updateOne(
      { conversationId },
      {
        $set: {
          messages,
          completed,
          updatedAt: now
        },
        $setOnInsert: {
          userId: SYSTEM_USER_ID,
          studentId: SYSTEM_STUDENT_ID,
          createdAt: now,
          summary: ''
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

async function getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
  try {
    const collection = await getCollection('conversations');
    const conversation = await collection.findOne({ conversationId });
    return conversation?.messages || [];
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

function convertToGeminiSchema(declaration: any): Tool {
  const convertedDeclaration = {
    ...declaration,
    parameters: declaration.parameters && {
      ...declaration.parameters,
      properties: Object.fromEntries(
        Object.entries(declaration.parameters.properties || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            type: value.type as Type,
          },
        ])
      ),
    },
  };

  return {
    functionDeclarations: [convertedDeclaration],
  };
}

type HandleCommandResult = {
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

type FunctionCallResponse = {
  name: string;
  response: {
    output: string;
    error?: string;
  };
};

export async function handleCommand(query: string): Promise<HandleCommandResult> {
  const conversationId = uuidv4();
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const tools: Tool[] = functionDeclarations.map(convertToGeminiSchema);

  const config: GenerateContentConfig = {
    maxOutputTokens: 500,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    tools,
    systemInstruction: [
      {
        text: systemInstruction,
      }
    ],
  };
  const model = 'gemini-2.0-flash';

  async function processResponse(aiResponse: any, conversationHistory: ConversationMessage[] = []): Promise<string | FunctionResponse> {
    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      console.log(aiResponse.text);
      const functionCall = aiResponse.functionCalls[0] as FunctionCall;
      console.log(`Function call: ${functionCall.name}`, functionCall.args);

      try {
        if (!functionCall.name) {
          throw new Error('Function name is undefined');
        }
        if (!functionCall.args) {
          throw new Error('Function arguments are undefined');
        }
        const scheduleFunction = (scheduleLib as any)[functionCall.name];
        if (typeof scheduleFunction !== 'function') {
          throw new Error(`Function ${functionCall.name} is not implemented in schedule library`);
        }

        const functionResult = await scheduleFunction(functionCall.args);
        const output = typeof functionResult === 'string' ? functionResult : JSON.stringify(functionResult);

        const modelMessage: ConversationMessage = {
          role: 'model',
          parts: [{
            functionResponse: {
              name: functionCall.name,
              response: { output }
            }
          }]
        };

        const updatedHistory = [...conversationHistory, modelMessage];
        await saveConversation(conversationId, updatedHistory);

        const nextResponse = await ai.models.generateContent({
          config,
          model,
          contents: updatedHistory,
        });

        return processResponse(nextResponse, updatedHistory);

      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Function execution error:`, error);
        
        const modelMessage: ConversationMessage = {
          role: 'model',
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
        
        const updatedHistory = [...conversationHistory, modelMessage];
        await saveConversation(conversationId, updatedHistory, true);
        
        return {
          name: functionCall.name || 'unknown',
          response: { 
            output: '',
            error 
          }
        };
      }
    } else if (aiResponse.text) {
      const modelMessage: ConversationMessage = {
        role: 'model',
        parts: [{ text: aiResponse.text }]
      };

      const updatedHistory = [...conversationHistory, modelMessage];
      await saveConversation(conversationId, updatedHistory, true);
      return aiResponse.text;
    }

    const error = 'No response or function call received';
    await saveConversation(conversationId, conversationHistory, true);
    return { response: { error } };
  }

  const initialHistory: ConversationMessage[] = [{
    role: 'user',
    parts: [{ text: query }]
  }];

  await saveConversation(conversationId, initialHistory);

  const response = await ai.models.generateContent({
    config,
    model,
    contents: initialHistory,
  });

  const result = await processResponse(response, initialHistory);
  console.log('Final response:', result);

  // Format the response for the API
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