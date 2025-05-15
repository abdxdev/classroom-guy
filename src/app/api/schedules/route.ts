import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';

export async function GET() {
  try {
    const collection = await getCollection('schedules');
    const schedules = await collection.find({}).toArray();
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
    const result = await collection.insertOne(data);
    return NextResponse.json(serializeDocument(result));
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}