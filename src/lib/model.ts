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
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

import functionDeclarations from '@/data/functionDeclarations.json';
import prevContents from '@/data/contents.json';

const systemInstruction = readFileSync(path.join(process.cwd(), 'src/data/systemInstructions.md'), 'utf-8');
const contentsPath = path.join(process.cwd(), 'src/data/contents.json');

interface ConversationPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: {
      output: string;
    };
  };
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: ConversationPart[];
}

function saveContents(contents: ConversationMessage[]) {
  try {
    writeFileSync(contentsPath, JSON.stringify(contents, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save conversation history:', error);
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

export async function handleScheduleCommand(query: string) {
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
    responseMimeType: 'text/plain',
    systemInstruction: [
      {
        text: systemInstruction,
      }
    ],
  };
  const model = 'gemini-2.0-flash';

  async function processResponse(aiResponse: any, conversationHistory: any[] = []): Promise<string | FunctionResponse> {
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

        conversationHistory.push({
          role: 'model',
          parts: [{
            functionResponse: {
              name: functionCall.name,
              response: { output }
            }
          }],
        });

        saveContents([...prevContents, ...conversationHistory]);

        const nextResponse = await ai.models.generateContent({
          config,
          model,
          contents: [...prevContents, ...conversationHistory],
        });

        // Recursively process any subsequent function calls
        return processResponse(nextResponse, conversationHistory);

      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Function execution error:`, error);
        return {
          name: functionCall.name,
          response: { error }
        };
      }
    } else if (aiResponse.text) {
      return aiResponse.text;
    }
    return { response: { error: 'No response or function call received' } };
  }

  const initialContents = [...prevContents, {
    role: 'user',
    parts: [{ text: query }],
  }];

  const response = await ai.models.generateContent({
    config,
    model,
    contents: initialContents,
  });

  const result = await processResponse(response);
  console.log('Final response:', result);

  try {
    // Save the updated conversation history
    const updatedContents = [...initialContents];
    if (typeof result === 'string') {
      updatedContents.push({
        role: 'model',
        parts: [{ text: result }]
      });
    } else if ('name' in result && 'response' in result) {
      updatedContents.push({
        role: 'model',
        parts: [{
          functionResponse: {
            name: result.name || 'unknown',
            response: {
              output: typeof result.response === 'string'
                ? result.response
                : JSON.stringify(result.response)
            }
          }
        }]
      });
    }
    saveContents(updatedContents);

    // Format the response for the API
    return {
      status: 'success',
      result: typeof result === 'string'
        ? { text: result }
        : {
          functionResponse: {
            name: result.name,
            response: result.response
          }
        }
    };
  } catch (error) {
    console.error('Error handling schedule command:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}