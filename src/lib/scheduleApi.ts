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
import * as scheduleLib from '../lib/schedule';
import functionDeclarations from '../context/functionDeclarations.json';
import { readFileSync } from 'fs';
import path from 'path';

const systemInstruction = readFileSync(path.join(process.cwd(), 'src/context/systemInstructions.md'), 'utf-8');
const prevContents = JSON.parse(readFileSync(path.join(process.cwd(), 'src/context/contents.json'), 'utf-8'));

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
  const contents = [...prevContents, {
    role: 'user',
    parts: [
      {
        text: query,
      },
    ],
  }];

  const response = await ai.models.generateContent({
    config,
    model,
    contents,
  });
  let functionResponse: FunctionResponse = {}

  if (response.functionCalls && response.functionCalls.length > 0) {
    console.log(response.text);
    const functionCall = response.functionCalls[0] as FunctionCall;
    const functionName = functionCall.name;
    const functionArgs = functionCall.args;

    console.log(`Function call: ${functionName}`, functionArgs);

    try {
      if (!functionName) {
        throw new Error('Function name is undefined');
      }
      if (!functionArgs) {
        throw new Error('Function arguments are undefined');
      }
      const allowedFunction = functionDeclarations.find(decl => decl.name === functionName);
      if (!allowedFunction) {
        throw new Error(`Function ${functionName} is not allowed`);
      }
      if (allowedFunction.parameters?.required) {
        const missingParams = allowedFunction.parameters.required.filter(
          param => !(param in functionArgs)
        );
        if (missingParams.length > 0) {
          throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
        }
      }
      const scheduleFunction = (scheduleLib as any)[functionName];
      if (typeof scheduleFunction !== 'function') {
        throw new Error(`Function ${functionName} is not implemented in schedule library`);
      }

      const functionResult = await scheduleFunction(functionArgs);
      const output = typeof functionResult === 'string' ? functionResult : JSON.stringify(functionResult);

      functionResponse = {
        name: functionName,
        response: { output }
      };

    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error(`Function execution error:`, error);

      functionResponse = {
        name: functionName,
        response: { error }
      };
    }
  } else if (response.text) {
    return response.text;
  }

  console.log('Function response:', functionResponse);
}