import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  // Start MongoDB Memory Server once for all tests
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'test-db-global',
    },
    binary: {
      version: '5.0.8',
    },
  });

  // Store the URI in environment variable for tests to use
  process.env.MONGODB_URI = mongoServer.getUri();
  console.log('Global MongoDB server started:', process.env.MONGODB_URI);
}

export async function globalTeardown() {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('Global MongoDB server stopped');
  }
}