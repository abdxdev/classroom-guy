import { ObjectId } from 'mongodb';
import { ValidTag } from '@/constants/tags';
import { Schedule, Course, TimeTableEntry, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleWithCourse } from '@/types/schedule';

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

export async function getSchedules(): Promise<ScheduleWithCourse[]> {
  return fetchApi<ScheduleWithCourse[]>('/api/schedules');
}

export async function getScheduleById(id: string | ObjectId): Promise<Schedule | null> {
  const scheduleId = typeof id === 'string' ? id : id.toString();
  return fetchApi<Schedule>(`/api/schedules?id=${scheduleId}`);
}

export async function createSchedule(scheduleData: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
  return fetchApi<Schedule>('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
  });
}

export async function updateSchedule(id: string | ObjectId, updateData: Partial<Omit<Schedule, '_id'>>): Promise<Schedule | null> {
  const scheduleId = typeof id === 'string' ? id : id.toString();
  return fetchApi<Schedule>(`/api/schedules?id=${scheduleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
}

export async function deleteSchedule(id: string | ObjectId): Promise<boolean> {
  const scheduleId = typeof id === 'string' ? id : id.toString();
  const result = await fetchApi<{ success: boolean }>(`/api/schedules?id=${scheduleId}`, {
    method: 'DELETE'
  });
  return result.success;
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
  // The API endpoint already sorts by date
  const schedules = await getSchedules();
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate >= startDate && scheduleDate <= endDate;
  });
}

export async function getSchedulesByCourseId(courseId: string): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?courseId=${courseId}`);
}

export async function getSchedulesByTag(tag: ValidTag): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?tag=${encodeURIComponent(tag)}`);
}

export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?date=${encodeURIComponent(date)}`);
}

export async function updateScheduleDescription(scheduleId: string, description: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { description });
}

export async function updateScheduleDate(scheduleId: string, date: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { date: new Date(date) });
}

export async function updateScheduleTag(scheduleId: string, tag: ValidTag): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { tag });
}

export async function updateScheduleCourseId(scheduleId: string, courseId: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { courseId });
}

export async function addNewSchedule(data: { courseId: string, description: string, date: string, tag: ValidTag }): Promise<Schedule> {
  return createSchedule({
    userId: SYSTEM_USER_ID,
    courseId: data.courseId,
    date: new Date(data.date),
    tag: data.tag,
    description: data.description
  });
}

// Time-related functions
export function getTime(): string {
  return new Date().toISOString();
}

// The following functions will need to be moved to their own API routes when implemented
export async function getAllCourses(): Promise<Course[]> {
  // TODO: Implement courses API endpoint
  return [];
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  // TODO: Implement courses API endpoint
  return null;
}

export async function getTimeTableByCourseId(courseId: string): Promise<TimeTableEntry[]> {
  // TODO: Implement timetable API endpoint
  return [];
}

export async function getAllTimeTables(): Promise<TimeTableEntry[]> {
  // TODO: Implement timetable API endpoint
  return [];
}

// Placeholder functions
export async function sendToAdmin(question: string): Promise<void> {}
export async function checkPreviousInteractions(fromOtherUsers: boolean): Promise<any[]> { return []; }
export async function askUser(question: string): Promise<void> {}
export async function ignorePrompt(): Promise<void> {}
export async function answerPrompt(): Promise<void> {}