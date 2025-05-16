import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';
import { SYSTEM_USER_ID } from '@/types/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const collection = await getCollection('weekly_time_tables');
    const res = collection.aggregate([
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
    const timetables = await res.toArray();
    return NextResponse.json(
      timetables.map((timetable) => {
        const serializedTimetable = serializeDocument(timetable);
        return {
          ...serializedTimetable,
          course: {
            ...serializedTimetable.course,
            _id: serializedTimetable.course._id.toString(),
          },
        };
      })
    );
  } catch (error) {
    console.error('Error in GET /api/timetables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const collection = await getCollection('weekly_time_tables');

    // Validate required fields
    if (!body.courseId || !body.day || !body.startTime || !body.endTime || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add system fields
    const timetable = {
      ...body,
      userId: SYSTEM_USER_ID,
      createdAt: new Date()
    };

    const result = await collection.insertOne(timetable);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      return NextResponse.json(
        { error: 'Failed to retrieve created timetable' },
        { status: 500 }
      );
    }

    return NextResponse.json(serializeDocument(created));
  } catch (error) {
    console.error('Error in POST /api/timetables:', error);
    return NextResponse.json(
      { error: 'Failed to create timetable entry' },
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
        { error: 'Timetable ID is required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid timetable ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const collection = await getCollection('weekly_time_tables');

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
        { error: 'Timetable entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDocument(result));
  } catch (error) {
    console.error('Error in PUT /api/timetables:', error);
    return NextResponse.json(
      { error: 'Failed to update timetable entry' },
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
        { error: 'Timetable ID is required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid timetable ID format' },
        { status: 400 }
      );
    }

    const collection = await getCollection('weekly_time_tables');
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Timetable entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/timetables:', error);
    return NextResponse.json(
      { error: 'Failed to delete timetable entry' },
      { status: 500 }
    );
  }
}