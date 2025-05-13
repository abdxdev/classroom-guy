'use server';

import { ScheduleItem } from '@/types/schedule';
import { ObjectId, WithId, Document } from 'mongodb';
import { getCollection, serializeDocument } from './db';

export async function createSchedule(scheduleData: Omit<ScheduleItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
  const collection = await getCollection('scheduleItems');
  
  const scheduleItem = {
    ...scheduleData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(scheduleItem);
  return serializeDocument({ ...scheduleItem, _id: result.insertedId });
}

export async function getSchedules(): Promise<ScheduleItem[]> {
  const collection = await getCollection('scheduleItems');
  const schedules = await collection.find<WithId<Document>>({}).sort({ deadline: 1 }).toArray();
  return schedules.map(serializeDocument);
}

export async function getScheduleById(id: string | ObjectId): Promise<ScheduleItem | null> {
  const collection = await getCollection('scheduleItems');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const schedule = await collection.findOne<WithId<Document>>({ _id });
  return schedule ? serializeDocument(schedule) : null;
}

export async function updateSchedule(id: string | ObjectId, updateData: Partial<Omit<ScheduleItem, '_id'>>): Promise<ScheduleItem | null> {
  const collection = await getCollection('scheduleItems');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;

  const update = {
    ...updateData,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  );

  return result ? serializeDocument(result) : null;
}

export async function reschedule(id: string | ObjectId, newDeadline: Date): Promise<ScheduleItem | null> {
  return updateSchedule(id, { deadline: newDeadline });
}

export async function deleteSchedule(id: string | ObjectId): Promise<boolean> {
  const collection = await getCollection('scheduleItems');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const result = await collection.deleteOne({ _id });
  return result.deletedCount === 1;
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<ScheduleItem[]> {
  const collection = await getCollection('scheduleItems');
  const schedules = await collection.find<WithId<Document>>({
    deadline: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ deadline: 1 })
  .toArray();
  return schedules.map(serializeDocument);
}