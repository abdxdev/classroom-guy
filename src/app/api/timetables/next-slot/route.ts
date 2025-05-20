import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { apiResponse, handleApiError, validateObjectId, validateDate } from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const dateStr = searchParams.get('date');

    const objectId = validateObjectId(courseId, 'courseId');
    if ('error' in objectId) return objectId;

    const dateResult = validateDate(dateStr);
    if ('error' in dateResult) return dateResult;

    // We know it's a Date at this point since we checked for error
    const parsedDate = dateResult as Date;

    const collection = await getCollection('weekly_time_tables');
    const currentDay = DAYS[parsedDate.getDay()];

    // Try to find next slot in current week
    const nextSlot = await collection.findOne(
      {
        courseId: objectId,
        day: { $in: DAYS.slice(DAYS.indexOf(currentDay)) },
      },
      {
        sort: {
          day: 1,
          startTime: 1,
        },
      }
    );

    if (nextSlot) {
      const daysToAdd = (DAYS.indexOf(nextSlot.day) - DAYS.indexOf(currentDay) + 7) % 7;
      const nextDate = new Date(parsedDate);
      nextDate.setDate(parsedDate.getDate() + daysToAdd);
      const [hours, minutes] = nextSlot.startTime.split(':');
      nextDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return apiResponse(nextDate);
    }

    // If no slot found in current week, find first slot of next week
    const firstSlotNextWeek = await collection.findOne(
      { courseId: objectId },
      { sort: { day: 1, startTime: 1 } }
    );

    if (firstSlotNextWeek) {
      const nextDate = new Date(parsedDate);
      const daysToAdd = (DAYS.indexOf(firstSlotNextWeek.day) - DAYS.indexOf(currentDay) + 7);
      nextDate.setDate(parsedDate.getDate() + daysToAdd);
      const [hours, minutes] = firstSlotNextWeek.startTime.split(':');
      nextDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return apiResponse(nextDate);
    }

    return apiResponse(null);
  } catch (error) {
    return handleApiError(error, 'GET /api/timetables/next-slot');
  }
}