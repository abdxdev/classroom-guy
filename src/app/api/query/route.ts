import { NextResponse } from 'next/server';
import { getCollection, serializeDocument } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const queryObject = body.query;
    
    if (!queryObject || typeof queryObject !== 'object') {
      throw new Error('Invalid query format');
    }

    const { collection, operation, filter = {}, sort, limit = 100, pipeline, update, options = {} } = queryObject;

    if (!collection) {
      throw new Error('Collection name is required');
    }

    const dbCollection = await getCollection(collection as any);
    console.log(`Operation: ${operation} on collection: ${collection}`);

    let result;
    switch (operation?.toLowerCase()) {
      case 'find':
        console.log('Find operation with filter:', filter);
        result = await dbCollection
          .find(filter)
          .sort(sort || {})
          .limit(limit)
          .toArray();
        console.log('Find operation result:', result);
        return NextResponse.json(result.map(doc => serializeDocument(doc)));
      
      case 'aggregate':
        if (!pipeline) {
          throw new Error('Pipeline is required for aggregate operation');
        }
        console.log('Aggregate operation with pipeline:', pipeline);
        result = await dbCollection
          .aggregate(pipeline)
          .limit(limit)
          .toArray();
        console.log('Aggregate operation result:', result);
        return NextResponse.json(result.map(doc => serializeDocument(doc)));
      
      case 'deleteone':
        console.log('DeleteOne operation with filter:', filter);
        result = await dbCollection.deleteOne(filter);
        console.log('DeleteOne operation result:', result);
        return NextResponse.json({ deletedCount: result.deletedCount });
      
      case 'deletemany':
        console.log('DeleteMany operation with filter:', filter);
        result = await dbCollection.deleteMany(filter);
        console.log('DeleteMany operation result:', result);
        return NextResponse.json({ deletedCount: result.deletedCount });
      
      case 'updateone':
        if (!update) {
          throw new Error('Update document is required for update operation');
        }
        console.log('UpdateOne operation:', { filter, update, options });
        result = await dbCollection.updateOne(filter, update, options);
        console.log('UpdateOne operation result:', result);
        return NextResponse.json({
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId
        });
      
      case 'updatemany':
        if (!update) {
          throw new Error('Update document is required for update operation');
        }
        console.log('UpdateMany operation:', { filter, update, options });
        result = await dbCollection.updateMany(filter, update, options);
        console.log('UpdateMany operation result:', result);
        return NextResponse.json({
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId
        });
      
      case 'insertone':
        if (!filter) {
          throw new Error('Document to insert is required');
        }
        console.log('InsertOne operation document:', filter);
        result = await dbCollection.insertOne(filter);
        console.log('InsertOne operation result:', result);
        return NextResponse.json({ insertedId: result.insertedId });
      
      case 'insertmany':
        if (!Array.isArray(filter)) {
          throw new Error('Array of documents is required for insertMany');
        }
        console.log('InsertMany operation documents:', filter);
        result = await dbCollection.insertMany(filter);
        console.log('InsertMany operation result:', result);
        return NextResponse.json({ insertedIds: result.insertedIds });
      
      default:
        throw new Error('Invalid operation. Supported operations are: find, aggregate, deleteOne, deleteMany, updateOne, updateMany, insertOne, insertMany');
    }
  } catch (error) {
    console.error('Error executing custom query:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}