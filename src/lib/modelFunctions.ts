import { ObjectId, WithId, Document } from 'mongodb';
import { getCollection, serializeDocument } from './db';
import { ValidTag } from '@/constants/tags';
import { Schedule, Course, TimeTableEntry, SYSTEM_USER_ID } from '@/types/db';
import { ScheduleWithCourse } from '@/types/schedule';

// Mappers
function safeMap<T extends Document>(doc: T): WithId<T> {
  if (!doc._id) {
    throw new Error('Document missing _id field');
  }
  return doc as WithId<T>;
}

export async function createSchedule(scheduleData: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
  const collection = await getCollection('schedules');
  const dbSchedule = {
    ...scheduleData,
    createdAt: new Date()
  };
  const result = await collection.insertOne(dbSchedule);
  return { ...dbSchedule, _id: result.insertedId };
}

export async function getSchedules(): Promise<ScheduleWithCourse[]> {
  const collection = await getCollection('schedules');
  const coursesCollection = await getCollection('courses');

  const schedules = await collection
    .aggregate([
      {
        $match: {
          userId: SYSTEM_USER_ID
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: {
          path: '$course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { date: 1 }
      }
    ])
    .toArray();

  return schedules.map(schedule => ({
    ...schedule,
    _id: schedule._id.toString(),
    course: schedule.course ? {
      ...schedule.course,
      _id: schedule.course._id.toString()
    } : undefined
  })) as ScheduleWithCourse[];
}

export async function getScheduleById(id: string | ObjectId): Promise<Schedule | null> {
  const collection = await getCollection('schedules');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const schedule = await collection.findOne<Schedule>({ _id });
  return schedule;
}

// Helper type for MongoDB findOneAndUpdate
type MongoDocument = WithId<Document> & Schedule;
type ScheduleUpdate = Partial<Omit<Schedule, '_id' | 'createdAt'>>;

export async function updateSchedule(id: string | ObjectId, updateData: Partial<Omit<Schedule, '_id'>>): Promise<Schedule | null> {
  const collection = await getCollection('schedules');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;

  const update: ScheduleUpdate = {
    updatedAt: new Date(),
  };

  // Copy all valid fields from updateData
  if (updateData.date) update.date = new Date(updateData.date);
  if (updateData.description) update.description = updateData.description;
  if (updateData.tag) update.tag = updateData.tag;
  if (updateData.title) update.title = updateData.title;
  if (updateData.courseId) update.courseId = updateData.courseId;
  if (updateData.userId) update.userId = updateData.userId;

  const result = await collection.findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  ) as MongoDocument | null;

  return result;
}

export async function reschedule(id: string | ObjectId, newDeadline: Date): Promise<Schedule | null> {
  return updateSchedule(id, { date: newDeadline });
}

export async function deleteSchedule(id: string | ObjectId): Promise<boolean> {
  const collection = await getCollection('schedules');
  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const result = await collection.deleteOne({ _id });
  return result.deletedCount === 1;
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ date: 1 })
    .toArray();
  return schedules;
}

// Time-related functions
export function getTime(): string {
  return new Date().toISOString();
}

// Course functions
export async function getAllCourses(): Promise<Course[]> {
  const collection = await getCollection('courses');
  const courses = await collection.find<Course>({}).toArray();
  return courses.map(serializeDocument);
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const collection = await getCollection('courses');
  const _id = new ObjectId(courseId);
  const course = await collection.findOne<Course>({ _id });
  return course ? serializeDocument(course) : null;
}

// Time table functions
export async function getTimeTableByCourseId(courseId: string): Promise<TimeTableEntry[]> {
  const collection = await getCollection('weekly_time_tables');
  const entries = await collection.find<TimeTableEntry>({ courseId }).toArray();
  return entries.map(serializeDocument);
}

export async function getAllTimeTables(): Promise<TimeTableEntry[]> {
  const collection = await getCollection('weekly_time_tables');
  const entries = await collection.find<TimeTableEntry>({}).toArray();
  return entries.map(serializeDocument);
}

// Schedule querying functions
export async function getAllSchedules(): Promise<Schedule[]> {
  return getSchedules();
}

export async function getSchedulesByCourseId(courseId: string): Promise<Schedule[]> {
  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({ courseId })
    .sort({ date: 1 })
    .toArray();
  return schedules;
}

export async function getScheduleByScheduleId(scheduleId: string): Promise<Schedule | null> {
  return getScheduleById(scheduleId);
}

export async function getSlotAfter(courseId: string, date: string): Promise<string> {
  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({
    courseId,
    date: { $gt: new Date(date) }
  })
    .sort({ date: 1 })
    .limit(1)
    .toArray();

  if (schedules.length === 0) {
    // If no schedules found after the date, return next day same time
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString();
  }

  return schedules[0].date.toISOString();
}

export async function getSchedulesBeforeDate(date: string): Promise<Schedule[]> {
  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({
    date: { $lt: new Date(date) }
  })
    .sort({ date: 1 })
    .toArray();
  return schedules;
}

export async function addNewSchedule(data: { courseId: string, description: string, date: string, tag: ValidTag }): Promise<Schedule> {
  const collection = await getCollection('schedules');
  const schedule: Omit<Schedule, '_id'> = {
    userId: SYSTEM_USER_ID,
    courseId: data.courseId,
    date: new Date(data.date),
    title: data.description.split('\n')[0], // First line as title
    tag: data.tag,
    description: data.description,
    createdAt: new Date()
  };

  const result = await collection.insertOne(schedule);
  return { ...schedule, _id: result.insertedId };
}

export async function getSchedulesByTag(tag: ValidTag): Promise<Schedule[]> {
  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({ tag })
    .sort({ date: 1 })
    .toArray();
  return schedules;
}

export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const collection = await getCollection('schedules');
  const schedules = await collection.find<Schedule>({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })
    .sort({ date: 1 })
    .toArray();
  return schedules;
}

export async function updateScheduleDescription(scheduleId: string, description: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { description });
}

export async function updateScheduleDate(scheduleId: string, date: string): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { date: new Date(date) });
}

export async function updateScheduleTag(scheduleId: string, tag: ValidTag): Promise<Schedule | null> {
  return updateSchedule(scheduleId, { tag });
}

export async function updateScheduleCourseId(scheduleId: string, courseId: string): Promise<Schedule | null> {
  const collection = await getCollection('schedules');
  const _id = new ObjectId(scheduleId);

  const result = await collection.findOneAndUpdate(
    { _id },
    {
      $set: {
        courseId,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  ) as MongoDocument | null;

  return result;
}

// Database utilities
export async function getCollectionNames(): Promise<string[]> {
  const collection = await getCollection('schedules');
  const collections = await (collection as any).db.listCollections().toArray();
  return collections.map((col: { name: string }) => col.name);
}

// The following functions are placeholders that will be implemented when user management is added
export async function sendToAdmin(question: string): Promise<void> {
  console.log('Admin question:', question);
  // To be implemented with user management
}

export async function checkPreviousInteractions(fromOtherUsers: boolean): Promise<any[]> {
  // To be implemented with user management
  return [];
}

export async function askUser(question: string): Promise<void> {
  console.log('User question:', question);
  // To be implemented with user management
}

export async function ignorePrompt(): Promise<void> {
  // To be implemented with user management
}

export async function answerPrompt(): Promise<void> {
  // To be implemented with user management
}