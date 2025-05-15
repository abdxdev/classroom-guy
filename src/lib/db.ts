import { MongoClient, Db, ObjectId, Document } from 'mongodb';

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

type validCollections = "users" | "students" | "courses" | "weekly_time_tables" | "schedules" | "conversations";

export async function getCollection(name: validCollections) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}