import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Parse the query string into an object
    let queryObject;
    try {
      queryObject = JSON.parse(body.query);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid query format' },
        { status: 400 }
      );
    }

    // Extract collection name and operation
    const collectionName = Object.keys(queryObject)[0] as 'schedules' | 'courses' | 'users' | 'students' | 'weekly_time_tables' | 'conversations';
    const operation = queryObject[collectionName];

    // Get the collection
    const collection = await getCollection(collectionName);
    
    // Execute the query based on the operation
    let result;
    if (operation === 'find') {
      result = await collection.find({}).limit(100).toArray();
    } else {
      result = await collection.find(operation).limit(100).toArray();
    }

    return NextResponse.json(result.map(doc => serializeDocument(doc)));
  } catch (error) {
    console.error('Error in POST /api/query:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}