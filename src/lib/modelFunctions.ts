import { Schedule, Course, TimeTableEntry, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleTableEntry } from '@/types/schedule';

async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else {
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(normalizedEndpoint, baseUrl);

  if ((!options?.method || options.method === 'GET') && params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const fetchOptions: RequestInit = {
    ...options,
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  };

  if (params && options?.method && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(params);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function getAllAggregatedSchedules(): Promise<ScheduleTableEntry[]> {
  return fetchApi<ScheduleTableEntry[]>('/api/schedules', { aggregate: true });
}

export async function getAllSchedules(): Promise<ScheduleTableEntry[]> {
  return fetchApi<ScheduleTableEntry[]>('/api/schedules');
}

export async function getScheduleByScheduleId({ scheduleId }: { scheduleId: string }): Promise<Schedule | null> {
  return fetchApi<Schedule>('/api/schedules', { id: scheduleId });
}

export async function getSchedulesByDateRange({ startDate, endDate }: { startDate: string; endDate: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', {
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString()
  });
}

export async function getSchedulesByCourseId({ courseId }: { courseId: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', { courseId });
}

export async function getSchedulesByTagId({ tagId }: { tagId: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', { tagId });
}

export async function getSchedulesByDate({ date }: { date: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', { date });
}

export async function getSchedulesBeforeDate({ date }: { date: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', { beforeDate: date });
}

export async function createSchedule({ courseId, date, tagId, description }: { courseId: string; date: string; tagId: string; description: string }): Promise<Schedule> {
  return fetchApi<Schedule>('/api/schedules', { userId: SYSTEM_USER_ID, courseId, date, tagId, description }, { method: 'POST' });
}

export async function addNewSchedule({ courseId, description, date, tagId }: { courseId: string; description: string; date: string; tagId: string }): Promise<Schedule> {
  return createSchedule({ courseId, date, tagId, description });
}

export async function updateSchedule({ scheduleId, description, date, tagId }: { scheduleId: string; description?: string; date?: string; tagId?: string }): Promise<Schedule | null> {
  return fetchApi<Schedule>('/api/schedules', { id: scheduleId, description, date, tagId }, { method: 'PUT' });
}

export async function updateScheduleDescription({ scheduleId, description }: { scheduleId: string; description: string }): Promise<Schedule | null> {
  return updateSchedule({ scheduleId, description });
}

export async function updateScheduleDate({ scheduleId, date }: { scheduleId: string; date: string }): Promise<Schedule | null> {
  return updateSchedule({ scheduleId, date });
}

export async function updateScheduleTagId({ scheduleId, tagId }: { scheduleId: string; tagId: string }): Promise<Schedule | null> {
  return updateSchedule({ scheduleId, tagId });
}

export async function updateScheduleCourseId({ scheduleId, courseId }: { scheduleId: string; courseId: string }): Promise<Schedule | null> {
  return fetchApi<Schedule>('/api/schedules', { id: scheduleId, courseId }, { method: 'PUT' });
}

export async function deleteSchedule({ scheduleId }: { scheduleId: string }): Promise<boolean> {
  const response = await fetchApi<{ success: boolean }>('/api/schedules', { id: scheduleId }, { method: 'DELETE' });
  return response.success;
}

export async function getTimeTableByCourseId({ courseId }: { courseId: string }): Promise<TimeTableEntry[]> {
  return fetchApi<TimeTableEntry[]>('/api/timetables', { courseId });
}

export async function getAllTimeTables(): Promise<TimeTableEntry[]> {
  return fetchApi<TimeTableEntry[]>('/api/timetables');
}

export async function getAllCourses(): Promise<Course[]> {
  return fetchApi<Course[]>('/api/courses');
}

export async function getCourseById({ id }: { id: string }): Promise<Course | null> {
  return fetchApi<Course | null>('/api/courses', { id });
}

export function getTime(): string {
  return new Date().toISOString();
}

export async function getSlotAfter({ courseId, date }: { courseId: string; date: string }): Promise<Date | null> {
  return fetchApi<Date | null>('/api/timetables/next-slot', { courseId, date });
}

export async function getCollectionNames(): Promise<string[]> {
  return fetchApi<string[]>('/api/collections');
}

export async function runCustomDatabaseQuery({ query }: { query: string }): Promise<any> {
  return fetchApi('/api/query', { query: JSON.parse(query) }, { method: 'POST' });
}

export async function sendToAdmin({ question }: { question: string }): Promise<void> {
  await fetchApi('/api/prompts/askAdmin', { question }, { method: 'POST' });
}

export async function checkPreviousInteractions({ fromOtherUsers }: { fromOtherUsers: boolean }): Promise<any[]> {
  return fetchApi<any[]>('/api/interactions', { fromOthers: fromOtherUsers });
}

export async function askUser({ question }: { question: string }): Promise<void> {
  await fetchApi('/api/user/questions', { question }, { method: 'POST' });
}

export async function ignorePrompt(): Promise<void> {
  await fetchApi('/api/prompts/ignorePrompt', {}, { method: 'POST' });
}