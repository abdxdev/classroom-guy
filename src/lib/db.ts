import { MongoClient, Db, ObjectId, Document } from 'mongodb';
import { ScheduleItem } from '@/types/schedule';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vstudent';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export function serializeDocument<T extends Document>(doc: T): ScheduleItem {
  const serialized = { ...doc } as any;

  if (serialized._id instanceof ObjectId) {
    serialized._id = serialized._id.toString();
  }

  for (const key in serialized) {
    if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    }
  }

  return serialized as ScheduleItem;
}

export async function getCollection(name: string) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}