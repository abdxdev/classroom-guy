import { NextRequest, NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { apiResponse, handleApiError, validateObjectId, validateDate } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection('schedules');
    const searchParams = request.nextUrl.searchParams;
    
    if (searchParams.get('aggregate') === 'true') {
      const schedules = await collection.aggregate([
        {
          $lookup: {
            from: "courses",
            let: { courseId: { $toObjectId: "$courseId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$courseId"] } } }],
            as: "course"
          }
        },
        { $unwind: "$course" },
        {
          $lookup: {
            from: "tags",
            localField: "tagId",
            foreignField: "_id",
            as: "tag",
          },
        },
        { $unwind: "$tag" },
        { $sort: { date: 1 } }
      ]).toArray();

      return apiResponse(schedules.map(schedule => ({
        ...serializeDocument(schedule),
        date: schedule.date ? new Date(schedule.date) : null,
        tag: {
          ...serializeDocument(schedule.tag),
          _id: schedule.tag._id.toString(),
        },
        course: {
          ...serializeDocument(schedule.course),
          _id: schedule.course._id.toString(),
        },
      })));
    }

    const filter: any = {};

    // CourseId filter
    const courseId = searchParams.get('courseId');
    if (courseId) {
      const objectId = validateObjectId(courseId, 'courseId');
      if ('error' in objectId) return objectId;
      filter.courseId = objectId;
    }

    // TagId filter
    const tagId = searchParams.get('tagId');
    if (tagId) filter.tagId = tagId;

    // Date filter
    const date = searchParams.get('date');
    if (date) {
      const parsedDate = validateDate(date);
      if ('error' in parsedDate) return parsedDate;
      filter.date = parsedDate;
    }

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const parsedStartDate = validateDate(startDate, 'startDate');
        if ('error' in parsedStartDate) return parsedStartDate;
        filter.date.$gte = parsedStartDate;
      }
      if (endDate) {
        const parsedEndDate = validateDate(endDate, 'endDate');
        if ('error' in parsedEndDate) return parsedEndDate;
        filter.date.$lte = parsedEndDate;
      }
    }

    const schedules = await collection.find(filter).toArray();
    return apiResponse(schedules.map(schedule => ({
      ...serializeDocument(schedule),
      date: schedule.date ? new Date(schedule.date) : null,
    })));
  } catch (error) {
    return handleApiError(error, 'GET /api/schedules');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = await getCollection('schedules');

    if (body.date && typeof body.date === 'string') {
      const parsedDate = validateDate(body.date);
      if ('error' in parsedDate) return parsedDate;
      body.date = parsedDate;
    }

    const newSchedule = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: SYSTEM_USER_ID,
    };

    const result = await collection.insertOne(newSchedule);
    return apiResponse(serializeDocument(result));
  } catch (error) {
    return handleApiError(error, 'POST /api/schedules');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    if ('error' in objectId) return objectId;

    const body = await request.json();
    const collection = await getCollection('schedules');

    if (body.date && typeof body.date === 'string') {
      const parsedDate = validateDate(body.date);
      if ('error' in parsedDate) return parsedDate;
      body.date = parsedDate;
    }

    const updateDoc = {
      ...body,
      updatedAt: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return apiResponse('Schedule not found', 404);
    }

    return apiResponse(serializeDocument(result));
  } catch (error) {
    return handleApiError(error, 'PUT /api/schedules');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const objectId = validateObjectId(id);
    
    // Handle case where validateObjectId returns an error response
    if (objectId instanceof NextResponse) {
      return objectId;
    }

    const collection = await getCollection('schedules');
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return apiResponse('Schedule not found', 404);
    }

    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/schedules');
  }
}