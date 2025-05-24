/**
 * TMDb API Client
 * 
 * This client is responsible for interacting with the TMDb API
 * to search for movies and get movie details.
 */

export interface TMDbSearchResult {
  id: number;
  title: string;
  releaseDate: string;
  year: number | undefined;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  genreIds: number[];
  overview: string;
}

export interface TMDbMovieDetails extends Omit<TMDbSearchResult, 'genreIds'> {
  genres: { id: number; name: string }[];
}

export interface TMDbTvShowResult extends Omit<TMDbSearchResult, 'title'> {
  name: string;
}

export interface TMDbTvShowDetails extends Omit<TMDbTvShowResult, 'genreIds'> {
  genres: { id: number; name: string }[];
}

export class TMDbClient {
  private apiKey: string;
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for movies in TMDb
   * @param query Search query
   * @returns Normalized movie results
   */
  async searchMovies(query: string): Promise<TMDbSearchResult[]> {
    const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US`;
    
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDb: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map((result: any) => this.normalizeMovieResult(result));
  }
  
  /**
   * Search for TV shows in TMDb
   * @param query Search query
   * @returns Normalized TV show results
   */
  async searchTvShows(query: string): Promise<TMDbSearchResult[]> {
    const url = `${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US`;
    
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDb: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map((result: any) => this.normalizeTvShowResult(result));
  }

  /**
   * Get movie details from TMDb
   * @param movieId TMDb movie ID
   * @returns Normalized movie details
   */
  async getMovieDetails(movieId: number): Promise<TMDbMovieDetails> {
    const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=en-US`;
    
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDb: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return this.normalizeMovieDetails(result);
  }

  /**
   * Normalize a movie result from TMDb
   * @param result Raw TMDb search result
   * @returns Normalized movie result
   */
  private normalizeMovieResult(result: any): TMDbSearchResult {
    const {
      id,
      title,
      release_date,
      poster_path,
      backdrop_path,
      vote_average,
      genre_ids,
      overview,
    } = result;
    
    // Extract year from release date
    const year = release_date ? parseInt(release_date.substring(0, 4), 10) : undefined;
    
    return {
      id,
      title,
      releaseDate: release_date,
      year,
      posterPath: poster_path ? `${this.imageBaseUrl}/w500${poster_path}` : null,
      backdropPath: backdrop_path ? `${this.imageBaseUrl}/original${backdrop_path}` : null,
      voteAverage: vote_average,
      genreIds: genre_ids,
      overview,
    };
  }

  /**
   * Get TV show details from TMDb
   * @param tvShowId TMDb TV show ID
   * @returns Normalized TV show details
   */
  async getTvShowDetails(tvShowId: number): Promise<TMDbTvShowDetails> {
    const url = `${this.baseUrl}/tv/${tvShowId}?api_key=${this.apiKey}&language=en-US`;
    
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDb: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return this.normalizeTvShowDetails(result);
  }

  /**
   * Normalize movie details from TMDb
   * @param result Raw TMDb movie details
   * @returns Normalized movie details
   */
  private normalizeMovieDetails(result: any): TMDbMovieDetails {
    const {
      id,
      title,
      release_date,
      poster_path,
      backdrop_path,
      vote_average,
      genres,
      overview,
    } = result;
    
    // Extract year from release date
    const year = release_date ? parseInt(release_date.substring(0, 4), 10) : undefined;
    
    return {
      id,
      title,
      releaseDate: release_date,
      year,
      posterPath: poster_path ? `${this.imageBaseUrl}/w500${poster_path}` : null,
      backdropPath: backdrop_path ? `${this.imageBaseUrl}/original${backdrop_path}` : null,
      voteAverage: vote_average,
      genres,
      overview,
    };
  }

  /**
   * Normalize a TV show result from TMDb
   * @param result Raw TMDb TV show result
   * @returns Normalized TV show result
   */
  private normalizeTvShowResult(result: any): TMDbSearchResult {
    const {
      id,
      name,
      first_air_date,
      poster_path,
      backdrop_path,
      vote_average,
      genre_ids,
      overview,
    } = result;
    
    // Extract year from first air date
    const year = first_air_date ? parseInt(first_air_date.substring(0, 4), 10) : undefined;
    
    return {
      id,
      title: name, // Map name to title for consistency
      releaseDate: first_air_date,
      year,
      posterPath: poster_path ? `${this.imageBaseUrl}/w500${poster_path}` : null,
      backdropPath: backdrop_path ? `${this.imageBaseUrl}/original${backdrop_path}` : null,
      voteAverage: vote_average,
      genreIds: genre_ids,
      overview,
    };
  }

  /**
   * Normalize TV show details from TMDb
   * @param result Raw TMDb TV show details
   * @returns Normalized TV show details
   */
  private normalizeTvShowDetails(result: any): TMDbTvShowDetails {
    const {
      id,
      name,
      first_air_date,
      poster_path,
      backdrop_path,
      vote_average,
      genres,
      overview,
    } = result;
    
    // Extract year from first air date
    const year = first_air_date ? parseInt(first_air_date.substring(0, 4), 10) : undefined;
    
    return {
      id,
      name,
      releaseDate: first_air_date,
      year,
      posterPath: poster_path ? `${this.imageBaseUrl}/w500${poster_path}` : null,
      backdropPath: backdrop_path ? `${this.imageBaseUrl}/original${backdrop_path}` : null,
      voteAverage: vote_average,
      genres,
      overview,
    };
  }
}
