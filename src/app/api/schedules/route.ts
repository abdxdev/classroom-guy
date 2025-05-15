import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { Schedule, SYSTEM_USER_ID } from '@/types/db';

export async function GET() {
  try {
    const collection = await getCollection('schedules');
    const schedules = await collection.find<Schedule>({}).toArray();
    const serializedSchedules = schedules.map(serializeDocument);
    return NextResponse.json(serializedSchedules);
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