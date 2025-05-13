import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vstudent';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return { client: cachedClient, db: cachedClient.db(MONGODB_DB) };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return { client, db: client.db(MONGODB_DB) };
}

function serializeDocument(doc: any) {
  const serialized = { ...doc };

  if (serialized._id instanceof ObjectId) {
    serialized._id = serialized._id.toString();
  }

  for (const key in serialized) {
    if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    }
  }

  return serialized;
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const schedules = await db.collection('scheduleItems').find({}).toArray();
    const serializedSchedules = schedules.map(serializeDocument);
    return NextResponse.json(serializedSchedules);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    const result = await db.collection('scheduleItems').insertOne(data);
    return NextResponse.json(serializeDocument(result));
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}