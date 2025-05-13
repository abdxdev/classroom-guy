import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration, Type } from '@google/genai';
import { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule, getSchedulesByDateRange, reschedule } from './schedule';
import { parseISO } from 'date-fns';
import { VALID_TAGS, ValidTag } from '@/constants/tags';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type ScheduleCommandInput = string | { query: string };

const createScheduleDeclaration: FunctionDeclaration = {
  name: 'createSchedule',
  parameters: {
    type: Type.OBJECT,
    description: 'Create a new schedule item.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'Title of the schedule item',
      },
      deadline: {
        type: Type.STRING,
        description: 'Deadline date in ISO format (e.g., "2025-05-13T15:00:00Z")',
      },
      tag: {
        type: Type.STRING,
        description: `Tag category must be one of: ${VALID_TAGS.join(', ')}`,
        enum: [...VALID_TAGS],
      },
      notes: {
        type: Type.STRING,
        description: 'Additional notes or description',
      },
    },
    required: ['title', 'deadline', 'tag'],
  },
};

const getScheduleDeclaration: FunctionDeclaration = {
  name: 'getSchedule',
  parameters: {
    type: Type.OBJECT,
    description: 'Get a schedule item by ID.',
    properties: {
      id: {
        type: Type.STRING,
        description: 'The ID of the schedule item to retrieve',
      },
    },
    required: ['id'],
  },
};

const updateScheduleDeclaration: FunctionDeclaration = {
  name: 'updateSchedule',
  parameters: {
    type: Type.OBJECT,
    description: 'Update a schedule item.',
    properties: {
      id: {
        type: Type.STRING,
        description: 'The ID of the schedule item to update',
      },
      title: {
        type: Type.STRING,
        description: 'New title of the schedule item',
      },
      deadline: {
        type: Type.STRING,
        description: 'New deadline date in ISO format',
      },
      tag: {
        type: Type.STRING,
        description: `New tag category must be one of: ${VALID_TAGS.join(', ')}`,
        enum: [...VALID_TAGS],
      },
      notes: {
        type: Type.STRING,
        description: 'New additional notes',
      },
    },
    required: ['id'],
  },
};

const deleteScheduleDeclaration: FunctionDeclaration = {
  name: 'deleteSchedule',
  parameters: {
    type: Type.OBJECT,
    description: 'Delete a schedule item.',
    properties: {
      id: {
        type: Type.STRING,
        description: 'The ID of the schedule item to delete',
      },
    },
    required: ['id'],
  },
};

const getSchedulesByDateRangeDeclaration: FunctionDeclaration = {
  name: 'getSchedulesByDateRange',
  parameters: {
    type: Type.OBJECT,
    description: 'Get schedules within a date range.',
    properties: {
      startDate: {
        type: Type.STRING,
        description: 'Start date in ISO format',
      },
      endDate: {
        type: Type.STRING,
        description: 'End date in ISO format',
      },
    },
    required: ['startDate', 'endDate'],
  },
};

export async function handleScheduleCommand(input: ScheduleCommandInput) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const functionDeclarations = [
    createScheduleDeclaration,
    getScheduleDeclaration,
    updateScheduleDeclaration,
    deleteScheduleDeclaration,
    getSchedulesByDateRangeDeclaration,
  ];

  const query = typeof input === 'string' ? input : input.query;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: query,
    config: {
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: functionDeclarations.map(d => d.name as string),
        }
      },
      tools: [{ functionDeclarations }]
    }
  });

  if (!response.functionCalls || response.functionCalls.length === 0) {
    return { error: 'No function call generated' };
  }

  const functionCall = response.functionCalls[0];
  if (!functionCall.args) {
    return { error: 'No arguments provided' };
  }
  
  const args = functionCall.args as Record<string, unknown>;

  try {
    switch (functionCall.name) {
      case 'createSchedule': {
        const tag = args.tag as ValidTag;
        if (!VALID_TAGS.includes(tag)) {
          return { error: `Invalid tag. Must be one of: ${VALID_TAGS.join(', ')}` };
        }
        return await createSchedule({
          title: args.title as string,
          tag,
          notes: args.notes as string | undefined,
          deadline: parseISO(args.deadline as string),
        });
      }

      case 'updateSchedule': {
        const updateData: any = { ...args };
        delete updateData.id;
        if (updateData.tag) {
          if (!VALID_TAGS.includes(updateData.tag as ValidTag)) {
            return { error: `Invalid tag. Must be one of: ${VALID_TAGS.join(', ')}` };
          }
          updateData.tag = updateData.tag as ValidTag;
        }
        if (updateData.deadline) {
          updateData.deadline = parseISO(updateData.deadline as string);
        }
        return await updateSchedule(args.id as string, updateData);
      }

      case 'getSchedule':
        return await getScheduleById(args.id as string);

      case 'deleteSchedule':
        return await deleteSchedule(args.id as string);

      case 'getSchedulesByDateRange':
        return await getSchedulesByDateRange(
          parseISO(args.startDate as string),
          parseISO(args.endDate as string)
        );

      default:
        return { error: 'Unknown function' };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
}