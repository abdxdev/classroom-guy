import { NextRequest } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { apiResponse, handleApiError, validateObjectId } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const collection = await getCollection('courses');

    if (id) {
      const objectId = validateObjectId(id);
      if ('error' in objectId) return objectId;

      const course = await collection.findOne({ _id: objectId });
      if (!course) {
        return apiResponse(null);
      }
      return apiResponse(serializeDocument(course));
    }

    const courses = await collection.find().toArray();
    return apiResponse(courses.map(course => serializeDocument(course)));
  } catch (error) {
    return handleApiError(error, 'GET /api/courses');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = await getCollection('courses');
    
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
      return apiResponse('Failed to retrieve created course', 500);
    }

    return apiResponse(serializeDocument(created));
  } catch (error) {
    return handleApiError(error, 'POST /api/courses');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    if ('error' in objectId) return objectId;

    const body = await request.json();
    const collection = await getCollection('courses');

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: {
          ...body,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return apiResponse('Course not found', 404);
    }

    return apiResponse(serializeDocument(result));
  } catch (error) {
    return handleApiError(error, 'PUT /api/courses');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    if ('error' in objectId) return objectId;

    const collection = await getCollection('courses');
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return apiResponse('Course not found', 404);
    }

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/courses');
  }
}