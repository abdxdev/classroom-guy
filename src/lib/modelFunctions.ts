import { Schedule, Course, TimeTableEntry, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleTableEntry } from '@/types/schedule';
import { fetchApi } from '@/lib/utils';

export async function getAllAggregatedSchedules(): Promise<ScheduleTableEntry[]> {
  const response = await fetchApi<{ data?: ScheduleTableEntry[] }>('/api/schedules', { aggregate: true });
  return response?.data || [];
}

export async function getAllSchedules(): Promise<ScheduleTableEntry[]> {
  return fetchApi<ScheduleTableEntry[]>('/api/schedules');
}

export async function getScheduleById({ scheduleId }: { scheduleId: string }): Promise<Schedule | null> {
  return fetchApi<Schedule>('/api/schedules', { id: scheduleId });
}

export async function getSchedulesByDateRange({ startDate, endDate }: { startDate: string; endDate: string }): Promise<Schedule[]> {
  return fetchApi<Schedule[]>('/api/schedules', { startDate: startDate, endDate });
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
  return fetchApi<boolean>(`/api/schedules?id=${scheduleId}`, {}, { method: 'DELETE' });
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

export async function getSlot({ courseId, date, slotType }: { courseId: string; date: string; slotType: string }): Promise<Date | null> {
  // TODO: To be implemented
  return fetchApi<Date | null>('/api/timetables/slot', { courseId, date, slotType });
}

export async function getCollectionNames(): Promise<string[]> {
  return fetchApi<string[]>('/api/collections');
}

export async function sendToAdmin({ question }: { question: string }): Promise<void> {
  await fetchApi('/api/prompts/askAdmin', { question }, { method: 'POST' });
}

export async function checkPreviousInteractions({ fromOthers, n }: { fromOthers: boolean; n: number }): Promise<any[]> {
  return fetchApi<any[]>('/api/interactions', { fromOthers, n });
}

export async function askUser({ question }: { question: string }): Promise<void> {
  // TODO: To be implemented
  await fetchApi('/api/user/questions', { question }, { method: 'POST' });
}

export async function ignorePrompt(): Promise<void> {
  // TODO: To be implemented
  await fetchApi('/api/prompts/ignorePrompt', {}, { method: 'POST' });
}