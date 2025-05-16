import { MongoClient, Db, ObjectId, Document } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used server-side');
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export function serializeDocument<T extends Document>(doc: T): any {
  const serialized = { ...doc } as any;

  for (const key in serialized) {
    if (serialized[key] instanceof ObjectId) {
      serialized[key] = serialized[key].toString();
    } else if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    } else if (Array.isArray(serialized[key])) {
      serialized[key] = serialized[key].map((item: any) => 
        item instanceof ObjectId ? item.toString() : item
      );
    }
  }

  return serialized;
}

type validCollections = "users" | "students" | "courses" | "weekly_time_tables" | "schedules" | "conversations" | "tags";

export async function getCollection(name: validCollections) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}