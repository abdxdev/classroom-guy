import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { Schedule, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleWithCourse } from '@/types/schedule';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const schedulesCollection = await getCollection('schedules');
    const coursesCollection = await getCollection('courses');
    
    const schedules = await schedulesCollection.find<Schedule>({}).toArray();
    const schedulesWithCourses: ScheduleWithCourse[] = [];
    for (const schedule of schedules) {
      const course = await coursesCollection.findOne({ _id: new ObjectId(schedule.courseId) });
      schedulesWithCourses.push({
        ...serializeDocument(schedule),
        course: course ? serializeDocument(course) : undefined
      });
    }

    return NextResponse.json(schedulesWithCourses);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const collection = await getCollection('schedules');
    const data = await request.json();
    
    const schedule: Omit<Schedule, '_id'> = {
      ...data,
      userId: SYSTEM_USER_ID,
      createdAt: new Date(),
      date: new Date(data.date)
    };

    const result = await collection.insertOne(schedule);
    return NextResponse.json(serializeDocument({ ...schedule, _id: result.insertedId }));
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}