import { NextResponse } from 'next/server';
import { handleCommand } from '@/lib/ai';
import { getCollection } from '@/lib/db';
import { Conversation } from '@/types/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId parameter' },
        { status: 400 }
      );
    }

    const collection = await getCollection('conversations');
    const conversation = await collection.findOne<Conversation>({ conversationId });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      conversation: {
        messages: conversation.messages,
        completed: conversation.completed
      }
    });
  } catch (error) {
    console.error('Error in GET /api/ai-function-call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body !== 'object' || !('query' in body) || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { query: string }' },
        { status: 400 }
      );
    }

    const result = await handleCommand(body.query);
    
    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      conversationId: result.conversationId,
      result: result.result
    });
  } catch (error) {
    console.error('Error in POST /api/ai-function-call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}