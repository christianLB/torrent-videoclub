import { MongoClient, Db, Collection } from 'mongodb';
import { MongoMediaItem, MongoCuratedList, MEDIA_ITEMS_COLLECTION, CURATED_LISTS_COLLECTION } from '../../types/mongo';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'torrentVideoclub'; // Default DB name if not set

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let client: MongoClient;
let db: Db;

interface MongoServiceType {
  connect: () => Promise<Db>;
  getDb: () => Db;
  getClient: () => MongoClient;
  getMediaItemsCollection: () => Collection<MongoMediaItem>;
  getCuratedListsCollection: () => Collection<MongoCuratedList>;
}

const MongoService: MongoServiceType = {
  async connect(): Promise<Db> {
    if (db) {
      return db;
    }
    try {
      client = new MongoClient(MONGODB_URI!);
      await client.connect();
      db = client.db(DB_NAME);
      console.log('Successfully connected to MongoDB.');
      return db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  },

  getDb(): Db {
    if (!db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return db;
  },

  getClient(): MongoClient {
    if (!client) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return client;
  },

  // Example for a specific collection - to be expanded
  // getMediaItemsCollection(): Collection<any> {
  //   if (!db) {
  //     throw new Error('MongoDB not connected. Call connect() first.');
  //   }
  getMediaItemsCollection(): Collection<MongoMediaItem> {
    if (!db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return db.collection<MongoMediaItem>(MEDIA_ITEMS_COLLECTION);
  },

  getCuratedListsCollection(): Collection<MongoCuratedList> {
    if (!db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return db.collection<MongoCuratedList>(CURATED_LISTS_COLLECTION);
  }

};

// Optional: Export a global instance or a function to get the instance
// export default MongoService;

// To ensure client is closed on app termination (especially for serverless environments or scripts)
// process.on('SIGINT', async () => {
//   if (client) {
//     await client.close();
//     console.log('MongoDB client disconnected due to app termination');
//   }
//   process.exit(0);
// });

export default MongoService;
