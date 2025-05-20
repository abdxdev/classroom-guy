import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { apiResponse, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const collection = await getCollection('conversations');
    const result = await collection.updateMany(
      {
        userId: SYSTEM_USER_ID,
        completed: false,
        status: { $ne: 'ignored' }
      },
      {
        $set: {
          status: 'ignored',
          updatedAt: new Date()
        }
      }
    );

    return apiResponse({ 
      success: true,
      ignored: result.modifiedCount 
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/prompts/ignorePrompt');
  }
}