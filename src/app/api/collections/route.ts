import { connectToDatabase } from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    return apiResponse(collections.map(col => col.name));
  } catch (error) {
    return handleApiError(error, 'GET /api/collections');
  }
}