import { FeaturedItem } from '../../../types/featured';
import { ProwlarrClient } from '../../prowlarr-client';
import { TrendingOptions } from './shared';

export class TvService {
  constructor(private prowlarrClient: ProwlarrClient) {}

  async getPopularTV(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TvService] Fetching popular TV shows');
    try {
      const results = await this.prowlarrClient.search({
        query: '*',
        type: 'tv',
        minSeeders: options.minSeeders || 5,
        limit: options.limit || 20
      });
      return results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
    } catch (error) {
      console.error('[TvService] Error:', error);
      return [];
    }
  }
}
