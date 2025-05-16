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
import { modifyString } from '@/lib/utils';
import { readFileSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import functionDeclarations from '@/data/functionDeclarations.json';
import dbSchema from '@/data/db.schema.json';

import { getCollection } from './db';
import { ConversationMessage, Conversation, SYSTEM_USER_ID, SYSTEM_STUDENT_ID } from '@/types/db';



let currentCourses: Record<string, string> = {};
const courseColl = await getCollection('courses');
const courses = await courseColl.find({}).toArray();
for (const course of courses) {
  currentCourses[course._id.toString()] = course.name;
}

let currentTags: Record<string, string> = {};
const tagColl = await getCollection('tags');
const tags = await tagColl.find({}).toArray();
for (const tag of tags) {
  currentTags[tag._id.toString()] = tag.title;
}

let currentSchedules: Record<string, any> = {};
const scheduleColl = await getCollection('schedules');
const schedules = await scheduleColl.find({}).toArray();
for (const schedule of schedules) {
  const scheduleId = schedule._id.toString();
  currentSchedules[scheduleId] = {
    courseId: schedule.courseId.toString(),
    date: schedule.date,
    tagId: schedule.tagId,
    description: schedule.description
  };
}

// let currentTimeTables: Record<string, any>[] = [];
// const timeTableColl = await getCollection('weekly_time_tables');
// const timeTables = await timeTableColl.find({}).toArray();
// for (const timeTable of timeTables) {
//   const entry = {
//     id: timeTable._id.toString(),
//     day: timeTable.day,
//     startTime: timeTable.startTime,
//     endTime: timeTable.endTime,
//     location: timeTable.location,
//     courseId: timeTable.courseId
//   };
//   currentTimeTables.push(entry);
// }

const systemInstruction = readFileSync(path.join(process.cwd(), 'src/data/systemInstructions.md'), 'utf-8');
const formattedSystemInstruction = modifyString(systemInstruction, {
  dbSchema: JSON.stringify(dbSchema, null, 2),
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().toLocaleString('default', { month: 'long' }),
  currentDate: new Date().getDate(),
  currentDay: new Date().toLocaleString('default', { weekday: 'long' }),
  currentCourses: JSON.stringify(currentCourses),
  currentTags: JSON.stringify(currentTags),
  currentSchedules: JSON.stringify(currentSchedules),
  // currentTimeTables: JSON.stringify(currentTimeTables),
});

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
  let conversationId: string;

  const collection = await getCollection('conversations');

  const incompleteConversation = await collection.findOne<Conversation>({
    completed: false,
    userId: SYSTEM_USER_ID,
    status: { $ne: 'ignored' }
  }, { sort: { updatedAt: -1 } });

  const previousConversations = await collection
    .find<Conversation>({
      userId: SYSTEM_USER_ID,
      completed: true,
      status: { $ne: 'ignored' }
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .toArray();

  const previousMessages = previousConversations
    .map(conv => conv.messages[conv.messages.length - 1])
    .filter(Boolean);

  if (incompleteConversation) {
    conversationId = incompleteConversation.conversationId;
  } else {
    conversationId = uuidv4();
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const tools: Tool[] = functionDeclarations.map(convertToGeminiSchema);

  const config: GenerateContentConfig = {
    maxOutputTokens: 500,
    temperature: 0,
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
        text: formattedSystemInstruction,
      }
    ],
  };
  const model = 'gemini-2.0-flash';

  async function processResponse(aiResponse: any, conversationHistory: ConversationMessage[] = []): Promise<string | FunctionResponse> {
    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      console.log('AI Response text:', aiResponse.text);
      const functionCall = aiResponse.functionCalls[0] as FunctionCall;
      console.log(`Function call: ${functionCall.name}`, functionCall.args);

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
        await saveConversation(conversationId, historyWithCall, true);
        return {
          name: 'ignorePrompt',
          response: { output: '' }
        };
      }

      if (functionCall.name === 'askUser') {
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

        const functionResult = await scheduleFunction(args);
        const output = typeof functionResult === 'string' ? functionResult : JSON.stringify(functionResult);

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
          model,
          contents: updatedHistory,
        });

        return processResponse(followupResponse, updatedHistory);

      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred';
        console.error(`Function execution error:`, error);

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
          model,
          contents: updatedHistory,
        });

        return processResponse(errorResponse, updatedHistory);
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
    model,
    contents: initialHistory,
  });

  const result = await processResponse(response, initialHistory);
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