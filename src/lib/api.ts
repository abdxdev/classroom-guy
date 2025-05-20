import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export function apiResponse<T>(
  result: T | null,
  status: number = 200
): NextResponse {
  if (status >= 400) {
    return NextResponse.json(
      { error: result as string },
      { status }
    );
  }
  return NextResponse.json(
    { data: result || undefined },
    { status }
  );
}

export function handleApiError(error: unknown, endpoint: string): NextResponse {
  console.error(`Error in ${endpoint}:`, error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
    { status: 500 }
  );
}

export function validateObjectId(id: string | null, fieldName: string = 'id'): ObjectId | NextResponse {
  if (!id) {
    return NextResponse.json(
      { error: `${fieldName} is required` },
      { status: 400 }
    );
  }

  try {
    return new ObjectId(id);
  } catch {
    return NextResponse.json(
      { error: `Invalid ${fieldName} format` },
      { status: 400 }
    );
  }
}

export function validateDate(date: string | null, fieldName: string = 'date'): Date | NextResponse {
  if (!date) {
    return NextResponse.json(
      { error: `${fieldName} is required` },
      { status: 400 }
    );
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: `Invalid ${fieldName} format` },
      { status: 400 }
    );
  }

  return parsedDate;
}