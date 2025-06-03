import { FeaturedItem } from '../../../types/featured';
import { ProwlarrClient } from '../../prowlarr-client';
import { TrendingOptions } from './shared';

export class MoviesService {
  constructor(private prowlarrClient: ProwlarrClient) {}

  async getTrendingMovies(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[MoviesService] Fetching trending movies');
    try {
      const results = await this.prowlarrClient.search({
        query: '*',
        type: 'movie',
        minSeeders: options.minSeeders || 5,
        limit: options.limit || 20
      });
      return results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
    } catch (error) {
      console.error('[MoviesService] Error:', error);
      return [];
    }
  }

  async get4KContent(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[MoviesService] Fetching 4K content');
    try {
      const results = await this.prowlarrClient.search({
        query: '4K OR 2160p OR UHD OR "Ultra HD"',
        minSeeders: options.minSeeders || 3,
        limit: options.limit || 20
      });
      return results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
    } catch (error) {
      console.error('[MoviesService] Error:', error);
      return [];
    }
  }
}
