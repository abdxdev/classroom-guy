export const SYSTEM_USER_ID = '6651234a1f1f1f1f1f1f1f1f';
export const SYSTEM_STUDENT_ID = '6651234b1f1f1f1f1f1f1f10';

interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User extends BaseDocument {
  name: string;
  email: string;
  university: string;
  password_hash: string;
}

export interface Student extends BaseDocument {
  userId: string;
  name: string;
  number: string;
  permission: string;
}

export interface Course extends BaseDocument {
  userId: string;
  name: string;
  short: string;
  code: string;
  description: string;
}

export interface TimeTableEntry extends BaseDocument {
  userId: string;
  courseId: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface Schedule extends BaseDocument {
  userId: string;
  courseId: string;
  date: Date;
  tagId: string;
  description: string;
}

export interface ConversationMessage {
  role: 'user' | 'model' | 'function';
  parts: Array<{
    text?: string;
    functionCall?: {
      name: string;
      args: Record<string, unknown>;
    };
    functionResponse?: {
      name: string;
      response: {
        output: string;
        error?: string;
      };
    };
  }>;

  timestamp?: Date;
}

export interface Conversation extends BaseDocument {
  userId: string;
  studentId: string;
  conversationId: string;
  messages: ConversationMessage[];
  summary: string;
  completed: boolean;
}

export interface Tag extends BaseDocument {
  userId: string;
  title: string;
  color: string;
}