import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { apiResponse, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;
    
    if (!question) {
      return apiResponse('Question is required', 400);
    }

    const collection = await getCollection('conversations');
    const existing = await collection.findOne({
      userId: SYSTEM_USER_ID,
      completed: false,
      status: { $ne: 'ignored' }
    });

    if (existing) {
      return apiResponse('There is already an active conversation', 400);
    }

    const conversation = {
      userId: SYSTEM_USER_ID,
      messages: [{ role: 'user', content: question }],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(conversation);
    return apiResponse({ success: true, id: result.insertedId });
  } catch (error) {
    return handleApiError(error, 'POST /api/prompts/askAdmin');
  }
}