'use server';

import { ScheduleItem } from '@/types/schedule';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vstudent';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function serializeDocument(doc: any) {
  const serialized = { ...doc };
  if (serialized._id instanceof ObjectId) {
    serialized._id = serialized._id.toString();
  }
  if (serialized.deadline instanceof Date) {
    serialized.deadline = serialized.deadline.toISOString();
  }
  if (serialized.createdAt instanceof Date) {
    serialized.createdAt = serialized.createdAt.toISOString();
  }
  if (serialized.updatedAt instanceof Date) {
    serialized.updatedAt = serialized.updatedAt.toISOString();
  }

  return serialized;
}

export async function createSchedule(scheduleData: Omit<ScheduleItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
  const { db } = await connectToDatabase();

  const scheduleItem: ScheduleItem = {
    ...scheduleData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('scheduleItems').insertOne(scheduleItem);
  return serializeDocument({ ...scheduleItem, _id: result.insertedId });
}

export async function getSchedules(): Promise<ScheduleItem[]> {
  const { db } = await connectToDatabase();
  const schedules = await db.collection('scheduleItems').find({}).sort({ deadline: 1 }).toArray();
  return schedules.map(serializeDocument);
}

export async function getScheduleById(id: string | ObjectId): Promise<ScheduleItem | null> {
  const { db } = await connectToDatabase();
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const schedule = await db.collection('scheduleItems').findOne({ _id });
  return schedule ? serializeDocument(schedule) : null;
}

export async function updateSchedule(id: string | ObjectId, updateData: Partial<Omit<ScheduleItem, '_id'>>): Promise<ScheduleItem | null> {
  const { db } = await connectToDatabase();
  const _id = typeof id === 'string' ? new ObjectId(id) : id;

  const update = {
    ...updateData,
    updatedAt: new Date(),
  };

  const result = await db.collection('scheduleItems').findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  );

  return result.value ? serializeDocument(result.value) : null;
}

export async function reschedule(id: string | ObjectId, newDeadline: Date): Promise<ScheduleItem | null> {
  return updateSchedule(id, { deadline: newDeadline });
}

export async function deleteSchedule(id: string | ObjectId): Promise<boolean> {
  const { db } = await connectToDatabase();
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const result = await db.collection('scheduleItems').deleteOne({ _id });
  return result.deletedCount === 1;
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<ScheduleItem[]> {
  const { db } = await connectToDatabase();
  const schedules = await db.collection('scheduleItems')
    .find({
      deadline: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .sort({ deadline: 1 })
    .toArray();
  return schedules.map(serializeDocument);
}