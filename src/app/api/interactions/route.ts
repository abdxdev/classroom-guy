import { NextRequest } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { apiResponse, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromOthers = searchParams.get('fromOthers') === 'true';
    const n = Number(searchParams.get('n')) || 10;

    const collection = await getCollection('conversations');
    
    const query = fromOthers 
      ? { userId: { $ne: SYSTEM_USER_ID }, completed: true }
      : { userId: SYSTEM_USER_ID, completed: true };

    const interactions = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(n)
      .toArray();

    return apiResponse(interactions.map(interaction => serializeDocument(interaction)));
  } catch (error) {
    return handleApiError(error, 'GET /api/interactions');
  }
}