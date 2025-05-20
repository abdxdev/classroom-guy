import { NextRequest } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID, SYSTEM_STUDENT_ID } from '@/types/db';
import { apiResponse, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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
      return apiResponse(conversation);
    }

    const conversations = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return apiResponse(conversations.map(conv => serializeDocument(conv)));
  } catch (error) {
    return handleApiError(error, 'GET /api/conversations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, messages, completed = false } = body;

    if (!conversationId || !Array.isArray(messages)) {
      return apiResponse('Invalid request format', 400);
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

    return apiResponse({
      success: true,
      upsertedId: result.upsertedId
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/conversations');
  }
}