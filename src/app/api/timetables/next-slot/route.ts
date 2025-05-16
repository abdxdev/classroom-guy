import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const date = searchParams.get('date');

    if (!courseId || !date) {
      return NextResponse.json(
        { error: 'courseId and date are required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(courseId);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid courseId format' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const collection = await getCollection('weekly_time_tables');
    const currentDay = DAYS[parsedDate.getDay()];
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

      const daysToAdd =
        (DAYS.indexOf(nextSlot.day) - DAYS.indexOf(currentDay) + 7) % 7;
      const nextDate = new Date(parsedDate);
      nextDate.setDate(parsedDate.getDate() + daysToAdd);
      const [hours, minutes] = nextSlot.startTime.split(':');
      nextDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      return NextResponse.json(nextDate);
    }
    const firstSlotNextWeek = await collection.findOne(
      {
        courseId: objectId,
      },
      {
        sort: {
          day: 1,
          startTime: 1,
        },
      }
    );

    if (firstSlotNextWeek) {

      const nextDate = new Date(parsedDate);
      const daysToAdd =
        (DAYS.indexOf(firstSlotNextWeek.day) - DAYS.indexOf(currentDay) + 7);
      nextDate.setDate(parsedDate.getDate() + daysToAdd);
      const [hours, minutes] = firstSlotNextWeek.startTime.split(':');
      nextDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      return NextResponse.json(nextDate);
    }
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error in GET /api/timetables/next-slot:', error);
    return NextResponse.json(
      { error: 'Failed to find next slot' },
      { status: 500 }
    );
  }
}