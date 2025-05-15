import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const collection = await getCollection('courses');

    if (id) {
      try {
        const query = { _id: new ObjectId(id) };
        const course = await collection.findOne(query);
        if (!course) {
          return NextResponse.json(null);
        }
        return NextResponse.json(serializeDocument(course));
      } catch (e) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
      }
    }

    const courses = await collection.find().toArray();
    return NextResponse.json(courses.map(course => serializeDocument(course)));

  } catch (error) {
    console.error('Error in GET /api/courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}