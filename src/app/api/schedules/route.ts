import { NextRequest, NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection('schedules');
    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get('aggregate') === 'true') {
      const res = collection.aggregate([
        {
          $lookup: {
            from: "tags",
            localField: "tagId",
            foreignField: "_id",
            as: "tag",
          },
        },
        { $unwind: "$tag" },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
      ]);
      const schedules = await res.toArray();
      return NextResponse.json(
        schedules.map((schedule) => ({
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
        }))
      );
    } else {
      const filter: any = {};

      const courseId = searchParams.get('courseId');
      if (courseId) {
        try {
          filter.courseId = new ObjectId(courseId);
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid courseId format' },
            { status: 400 }
          );
        }
      }

      const tagId = searchParams.get('tagId');
      if (tagId) {
        const validTags = ['assignment', 'quiz', 'mid', 'viva', 'final', 'ccp', 'project', 'other'];
        if (!validTags.includes(tagId)) {
          return NextResponse.json(
            { error: 'Invalid tagId value' },
            { status: 400 }
          );
        }
        filter.tagId = tagId;
      }

      const date = searchParams.get('date');
      if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          filter.date = parsedDate;
        }
      }

      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
          const parsedStartDate = new Date(startDate);
          if (!isNaN(parsedStartDate.getTime())) {
            filter.date.$gte = parsedStartDate;
          }
        }
        if (endDate) {
          const parsedEndDate = new Date(endDate);
          if (!isNaN(parsedEndDate.getTime())) {
            filter.date.$lte = parsedEndDate;
          }
        }
      }
      const schedules = await collection
      .find()
      .toArray();
      
      return NextResponse.json(
        schedules.map((schedule) => ({
          ...serializeDocument(schedule),
          date: schedule.date ? new Date(schedule.date) : null,
        }))
      );
    }
  } catch (error) {
    console.error('Error in GET /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const collection = await getCollection('schedules');

    if (body.date && typeof body.date === 'string') {
      const date = new Date(body.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      body.date = date;
    }

    const newSchedule = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: SYSTEM_USER_ID,
    };

    const result = await collection.insertOne(newSchedule);
    return NextResponse.json(serializeDocument(result));
  }
  catch (error) {
    console.error('Error in POST /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid schedule ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const collection = await getCollection('schedules');

    if (body.date && typeof body.date === 'string') {
      const date = new Date(body.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      body.date = date;
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
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDocument(result));
  } catch (error) {
    console.error('Error in PUT /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid schedule ID format' },
        { status: 400 }
      );
    }

    const collection = await getCollection('schedules');
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/schedules:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}