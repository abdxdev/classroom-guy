import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';

export async function POST() {
  try {
    const collection = await getCollection('conversations');
    
    // Save the ignored status in the conversation
    await collection.findOneAndUpdate(
      { 
        userId: SYSTEM_USER_ID,
        completed: false 
      },
      { 
        $set: { 
          status: 'ignored',
          completed: true,
          updatedAt: new Date()
        } 
      },
      { 
        sort: { updatedAt: -1 }
      }
    );

    // Return no content since we don't need to send a response
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in POST /api/prompts/ignore:', error);
    return NextResponse.json(
      { error: 'Failed to ignore prompt' },
      { status: 500 }
    );
  }
}