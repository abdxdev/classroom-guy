import { NextResponse } from 'next/server';
import { handleScheduleCommand } from '@/lib/scheduleApi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle both string and query object formats
    if (typeof body === 'string' || (typeof body === 'object' && 'query' in body && typeof body.query === 'string')) {
      const result = await handleScheduleCommand(body);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid request format. Expected string or { query: string }' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}