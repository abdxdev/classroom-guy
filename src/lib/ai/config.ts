import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { readFileSync } from 'fs';
import path from 'path';
import { modifyString } from '@/lib/utils';
import { getCollection } from '@/lib/db';
import dbSchema from '@/data/db.schema.json';

// Initialize current state
export const getCurrentState = async () => {
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
    const scheduleId = schedule._id?.toString() || '';
    currentSchedules[scheduleId] = {
      courseId: schedule.courseId ? (typeof schedule.courseId === 'string' ? schedule.courseId : schedule.courseId.toString()) : '',
      date: schedule.date || null,
      tagId: schedule.tagId || '',
      description: schedule.description || ''
    };
  }

  return { currentCourses, currentTags, currentSchedules };
};

// Initialize system instructions
export const getSystemInstruction = async () => {
  const state = await getCurrentState();
  const systemInstruction = readFileSync(path.join(process.cwd(), 'src/data/systemInstructions.md'), 'utf-8');
  return modifyString(systemInstruction, {
    dbSchema: JSON.stringify(dbSchema, null, 2),
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().toLocaleString('default', { month: 'long' }),
    currentDate: new Date().getDate(),
    currentDay: new Date().toLocaleString('default', { weekday: 'long' }),
    currentCourses: JSON.stringify(state.currentCourses),
    currentTags: JSON.stringify(state.currentTags),
    currentSchedules: JSON.stringify(state.currentSchedules),
  });
};

// Initialize AI configuration
export const initializeAI = async () => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const config: GenerateContentConfig = {
    maxOutputTokens: 500,
    temperature: 0,
    systemInstruction: [
      {
        text: await getSystemInstruction(),
      }
    ],
  };

  return { ai, config };
};

export const MODEL_NAME = 'gemini-2.0-flash';