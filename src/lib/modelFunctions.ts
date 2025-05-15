import { Schedule, Course, TimeTableEntry, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleTableEntry } from '@/types/schedule';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

export async function getAllSchedules(): Promise<ScheduleTableEntry[]> {
  return fetchApi<ScheduleTableEntry[]>('/api/schedules');
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  return fetchApi<Schedule>(`/api/schedules?id=${id}`);
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
  const schedules = await getAllSchedules();
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate >= startDate && scheduleDate <= endDate;
  });
}

export async function getSchedulesByCourseId(courseId: string): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?courseId=${courseId}`);
}

export async function getSchedulesByTag(tag: string): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?tag=${encodeURIComponent(tag)}`);
}

export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
  return fetchApi<Schedule[]>(`/api/schedules?date=${encodeURIComponent(date)}`);
}

export async function getSchedulesBeforeDate(date: string): Promise<Schedule[]> {
  const allSchedules = await getAllSchedules();
  const compareDate = new Date(date);
  return allSchedules.filter(schedule => new Date(schedule.date) < compareDate);
}

export async function createSchedule(scheduleData: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
  return fetchApi<Schedule>('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
  });
}

export async function addNewSchedule(data: { courseId: string, description: string, date: string, tagId: string }): Promise<Schedule> {
  return createSchedule({
    userId: SYSTEM_USER_ID,
    courseId: data.courseId,
    date: new Date(data.date),
    tagId: data.tagId,
    description: data.description
  });
}

export async function updateSchedule(id: string, updateData: Partial<Omit<Schedule, '_id'>>): Promise<Schedule | null> {
  return fetchApi<Schedule>(`/api/schedules?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
}

export async function updateScheduleDescription(scheduleId: string, description: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { description });
}

export async function updateScheduleDate(scheduleId: string, date: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { date: new Date(date) });
}

export async function updateScheduleTag(scheduleId: string, tag: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { tagId: tag });
}

export async function updateScheduleCourseId(scheduleId: string, courseId: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { courseId });
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const result = await fetchApi<{ success: boolean }>(`/api/schedules?id=${id}`, {
    method: 'DELETE'
  });
  return result.success;
}

export async function getTimeTableByCourseId(courseId: string): Promise<TimeTableEntry[]> {
  return fetchApi<TimeTableEntry[]>(`/api/timetables?courseId=${courseId}`);
}

export async function getAllTimeTables(): Promise<TimeTableEntry[]> {
  return fetchApi<TimeTableEntry[]>('/api/timetables');
}

export async function getAllCourses(): Promise<Course[]> {
  return fetchApi<Course[]>('/api/courses');
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  return fetchApi<Course | null>(`/api/courses?id=${courseId}`);
}

export function getTime(): string {
  return new Date().toISOString();
}

export async function getSlotAfter(courseId: string, date: string): Promise<Date | null> {
  const timetables = await getTimeTableByCourseId(courseId);
  const targetDate = new Date(date);
  const schedules = await getSchedulesByCourseId(courseId);


  const sortedTimeSlots = timetables.sort((a, b) => {
    if (a.day === b.day) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.day.localeCompare(b.day);
  });


  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(targetDate);
    checkDate.setDate(checkDate.getDate() + i);

    const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const timeSlot = sortedTimeSlots.find(slot => slot.day.toLowerCase() === dayOfWeek);

    if (timeSlot) {
      const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
      checkDate.setHours(hours, minutes, 0, 0);


      const isSlotTaken = schedules.some(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate.getTime() === checkDate.getTime();
      });

      if (!isSlotTaken) {
        return checkDate;
      }
    }
  }

  return null;
}

export async function getCollectionNames(): Promise<string[]> {
  return fetchApi<string[]>('/api/collections');
}

export async function runCustomDatabaseQuery(query: string): Promise<any> {
  return fetchApi('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
}

export async function sendToAdmin(question: string): Promise<void> {
  await fetchApi('/api/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
}

export async function checkPreviousInteractions(fromOtherUsers: boolean): Promise<any[]> {
  return fetchApi<any[]>(`/api/interactions?fromOthers=${fromOtherUsers}`);
}

export async function askUser(question: string): Promise<void> {
  await fetchApi('/api/user/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
}

export async function ignorePrompt(): Promise<void> {
  await fetchApi('/api/prompts/ignore', { method: 'POST' });
}

export async function answerPrompt(): Promise<void> {
  await fetchApi('/api/prompts/answer', { method: 'POST' });
}