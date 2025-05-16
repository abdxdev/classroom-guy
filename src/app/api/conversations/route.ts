import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ConversationMessage, SYSTEM_USER_ID, SYSTEM_STUDENT_ID } from '@/types/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 10;
    const completed = searchParams.get('completed') === 'true';
    const newest = searchParams.get('newest') === 'true';

    const collection = await getCollection('conversations');
    const query = {
      userId: SYSTEM_USER_ID,
      completed,
      status: { $ne: 'ignored' }
    };

    if (newest) {
      const conversation = await collection.findOne(query, { sort: { updatedAt: -1 } });
      return NextResponse.json(conversation || null);
    }

    const conversations = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, messages, completed = false } = body;

    if (!conversationId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const collection = await getCollection('conversations');
    const now = new Date();

    const result = await collection.updateOne(
      { conversationId },
      {
        $set: {
          messages,
          completed,
          updatedAt: now
        },
        $setOnInsert: {
          userId: SYSTEM_USER_ID,
          studentId: SYSTEM_STUDENT_ID,
          createdAt: now,
          summary: ''
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      upsertedId: result.upsertedId
    });
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}