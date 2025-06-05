import MongoService from './mongo-service';
import { MongoFeaturedCategory, FEATURED_CATEGORIES_COLLECTION } from '../../types/mongo';

export const DEFAULT_CATEGORIES: MongoFeaturedCategory[] = [
  { _id: 'trending-now', title: 'Trending Now', type: 'movie', tmdbParams: { source: 'trendingMovies' }, order: 1, enabled: true },
  { _id: 'popular-tv', title: 'Popular TV Shows', type: 'tv', tmdbParams: { source: 'popularTV' }, order: 2, enabled: true },
  { _id: 'new-releases', title: 'New Releases', type: 'movie', tmdbParams: { source: 'newReleases' }, order: 3, enabled: true },
  { _id: 'top-4k', title: 'Top 4K Content', type: 'movie', tmdbParams: { source: 'top4KContent' }, order: 4, enabled: true },
  { _id: 'documentaries', title: 'Documentaries', type: 'movie', tmdbParams: { source: 'documentaries' }, order: 5, enabled: true },
];

export class CategoryConfigService {
  private static initialized = false;

  private static async getCollection() {
    await MongoService.connect();
    return MongoService.getDb().collection<MongoFeaturedCategory>(FEATURED_CATEGORIES_COLLECTION);
  }

  static async initialize() {
    if (this.initialized) return;
    const collection = await this.getCollection();
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(DEFAULT_CATEGORIES);
    }
    this.initialized = true;
  }

  static async getAllCategories(): Promise<MongoFeaturedCategory[]> {
    await this.initialize();
    const collection = await this.getCollection();
    return collection.find().sort({ order: 1 }).toArray();
  }

  static async upsertCategory(cat: MongoFeaturedCategory): Promise<void> {
    await this.initialize();
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: cat._id },
      { $set: { ...cat } },
      { upsert: true }
    );
  }

  static async deleteCategory(id: string): Promise<void> {
    await this.initialize();
    const collection = await this.getCollection();
    await collection.deleteOne({ _id: id });
  }
}
