import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    return NextResponse.json(collectionNames);
  } catch (error) {
    console.error('Error in GET /api/collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}