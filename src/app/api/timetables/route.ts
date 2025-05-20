import { NextRequest } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { apiResponse, handleApiError, validateObjectId } from '@/lib/api';

export async function GET() {
  try {
    const collection = await getCollection('weekly_time_tables');
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
      ])
      .toArray();

    return apiResponse(
      result.map((timetable) => ({
        ...serializeDocument(timetable),
        course: {
          ...serializeDocument(timetable.course),
          _id: timetable.course._id.toString(),
        },
      }))
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/timetables');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.courseId ||
      !body.day ||
      !body.startTime ||
      !body.endTime ||
      !body.location
    ) {
      return apiResponse('Missing required fields', 400);
    }

    const collection = await getCollection('weekly_time_tables');
    const timetable = {
      ...body,
      userId: SYSTEM_USER_ID,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(timetable);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      return apiResponse('Failed to retrieve created timetable', 500);
    }

    return apiResponse(serializeDocument(created));
  } catch (error) {
    return handleApiError(error, 'POST /api/timetables');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    if ('error' in objectId) return objectId;

    const body = await request.json();
    const collection = await getCollection('weekly_time_tables');

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return apiResponse('Timetable entry not found', 404);
    }

    return apiResponse(serializeDocument(result));
  } catch (error) {
    return handleApiError(error, 'PUT /api/timetables');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    if ('error' in objectId) return objectId;

    const collection = await getCollection('weekly_time_tables');
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return apiResponse('Timetable entry not found', 404);
    }

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/timetables');
  }
}