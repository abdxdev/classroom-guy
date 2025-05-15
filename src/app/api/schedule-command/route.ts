import { NextResponse } from 'next/server';
import { handleScheduleCommand } from '@/lib/model';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body === 'object' && 'query' in body && typeof body.query === 'string') {
      const result = await handleScheduleCommand(body.query);
      
      if (result.status === 'error') {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid request format. Expected { query: string }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}