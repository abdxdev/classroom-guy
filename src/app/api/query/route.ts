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
    let queryObject;
    try {
      queryObject = JSON.parse(body.query);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid query format' },
        { status: 400 }
      );
    }
    const { find, filter = {}, sort, limit = 100 } = queryObject;

    if (!find) {
      return NextResponse.json(
        { error: 'Collection name (find) is required' },
        { status: 400 }
      );
    }
    const collection = await getCollection(find);
    const result = await collection
      .find(filter)
      .sort(sort || {})
      .limit(limit)
      .toArray();

    return NextResponse.json(result.map(doc => serializeDocument(doc)));
  } catch (error) {
    console.error('Error in POST /api/query:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}