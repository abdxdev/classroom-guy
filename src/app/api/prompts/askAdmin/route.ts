import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('conversations');
    await collection.insertOne({
      userId: SYSTEM_USER_ID,
      question,
      type: 'admin',
      createdAt: new Date(),
      status: 'pending'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/prompts/askAdmin:', error);
    return NextResponse.json(
      { error: 'Failed to send question to admin' },
      { status: 500 }
    );
  }
}