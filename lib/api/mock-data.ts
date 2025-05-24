/**
 * Mock data for development when APIs are unavailable
 * This allows the application to function for testing even when external APIs are down
 */

export const mockMovies = [
  {
    guid: "mock-1",
    title: "The Matrix",
    year: 1999,
    quality: "1080p",
    format: "BluRay",
    codec: "x264",
    size: 8589934592, // 8 GB
    sizeFormatted: "8.00 GB",
    indexer: "Mock Indexer",
    seeders: 120,
    leechers: 5,
    tmdb: {
      id: 603,
      posterPath: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
      voteAverage: 8.2,
      genreIds: [28, 878],
      overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth."
    }
  },
  {
    guid: "mock-2",
    title: "The Matrix Reloaded",
    year: 2003,
    quality: "1080p",
    format: "BluRay",
    codec: "x264",
    size: 10737418240, // 10 GB
    sizeFormatted: "10.00 GB",
    indexer: "Mock Indexer",
    seeders: 80,
    leechers: 3,
    tmdb: {
      id: 604,
      posterPath: "https://image.tmdb.org/t/p/w500/9TGHDvWrqKBzwDxDodHYXEmOE6J.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/3v3kPYR2VQxNPwWUJrvJR7o4hQZ.jpg",
      voteAverage: 6.9,
      genreIds: [28, 878],
      overview: "Six months after the events depicted in The Matrix, Neo has proved to be a good omen for the free humans, as more and more humans are being freed from the matrix and brought to Zion, the one and only stronghold of the Resistance."
    }
  },
  {
    guid: "mock-3",
    title: "The Matrix Revolutions",
    year: 2003,
    quality: "1080p",
    format: "BluRay",
    codec: "x264",
    size: 9663676416, // 9 GB
    sizeFormatted: "9.00 GB",
    indexer: "Mock Indexer",
    seeders: 65,
    leechers: 2,
    tmdb: {
      id: 605,
      posterPath: "https://image.tmdb.org/t/p/w500/fgOQOmR9GVLlVZZTU224aXQfbce.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/7u3pxc0K1wx32IleAkLv78MKgrw.jpg",
      voteAverage: 6.7,
      genreIds: [28, 878],
      overview: "The human city of Zion defends itself against the massive invasion of the machines as Neo fights to end the war at another front while also opposing the rogue Agent Smith."
    }
  },
  {
    guid: "mock-4",
    title: "The Matrix Resurrections",
    year: 2021,
    quality: "2160p",
    format: "WEB-DL",
    codec: "x265",
    size: 16106127360, // 15 GB
    sizeFormatted: "15.00 GB",
    indexer: "Mock Indexer",
    seeders: 150,
    leechers: 25,
    tmdb: {
      id: 624860,
      posterPath: "https://image.tmdb.org/t/p/w500/8c4a8kE7PizaGQQnditMmI1xbRp.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/eNI7PtK6DEYgZmRWE38AnpAdQnG.jpg",
      voteAverage: 6.5,
      genreIds: [28, 878],
      overview: "Plagued by strange memories, Neo's life takes an unexpected turn when he finds himself back inside the Matrix."
    }
  },
  {
    guid: "mock-5",
    title: "The Shawshank Redemption",
    year: 1994,
    quality: "1080p",
    format: "BluRay",
    codec: "x264",
    size: 11811160064, // 11 GB
    sizeFormatted: "11.00 GB",
    indexer: "Mock Indexer",
    seeders: 200,
    leechers: 3,
    tmdb: {
      id: 278,
      posterPath: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
      voteAverage: 8.7,
      genreIds: [18, 80],
      overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden."
    }
  }
];

export const mockSeries = [
  {
    guid: "mock-tv-1",
    title: "Breaking Bad",
    year: 2008,
    quality: "1080p",
    format: "WEB-DL",
    codec: "x264",
    size: 21474836480, // 20 GB
    sizeFormatted: "20.00 GB",
    indexer: "Mock Indexer",
    seeders: 300,
    leechers: 15,
    tmdb: {
      id: 1396,
      posterPath: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/6LWy0jvMpmjoS9fJQcCGTdkcnwP.jpg",
      voteAverage: 8.7,
      genreIds: [18],
      overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime."
    }
  },
  {
    guid: "mock-tv-2",
    title: "Game of Thrones",
    year: 2011,
    quality: "1080p",
    format: "BluRay",
    codec: "x264",
    size: 26843545600, // 25 GB
    sizeFormatted: "25.00 GB",
    indexer: "Mock Indexer",
    seeders: 250,
    leechers: 10,
    tmdb: {
      id: 1399,
      posterPath: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      voteAverage: 8.3,
      genreIds: [10765, 18, 10759],
      overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and the icy horrors beyond."
    }
  },
  {
    guid: "mock-tv-3",
    title: "Stranger Things",
    year: 2016,
    quality: "2160p",
    format: "WEB-DL",
    codec: "x265",
    size: 16106127360, // 15 GB
    sizeFormatted: "15.00 GB",
    indexer: "Mock Indexer",
    seeders: 280,
    leechers: 30,
    tmdb: {
      id: 66732,
      posterPath: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
      voteAverage: 8.4,
      genreIds: [18, 10765, 9648],
      overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl."
    }
  },
  {
    guid: "mock-tv-4",
    title: "The Office",
    year: 2005,
    quality: "1080p",
    format: "WEB-DL",
    codec: "x264",
    size: 10737418240, // 10 GB
    sizeFormatted: "10.00 GB",
    indexer: "Mock Indexer",
    seeders: 150,
    leechers: 5,
    tmdb: {
      id: 2316,
      posterPath: "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/9lI0vVrXNnVHq0M1D8V08xM4CV3.jpg",
      voteAverage: 8.5,
      genreIds: [35],
      overview: "The everyday lives of office employees in the Scranton, Pennsylvania branch of the fictional Dunder Mifflin Paper Company."
    }
  },
  {
    guid: "mock-tv-5",
    title: "The Mandalorian",
    year: 2019,
    quality: "2160p",
    format: "WEB-DL",
    codec: "x265",
    size: 12884901888, // 12 GB
    sizeFormatted: "12.00 GB",
    indexer: "Mock Indexer",
    seeders: 320,
    leechers: 25,
    tmdb: {
      id: 82856,
      posterPath: "https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg",
      voteAverage: 8.4,
      genreIds: [10765, 10759, 18],
      overview: "After the fall of the Galactic Empire, lawlessness has spread throughout the galaxy. A lone gunfighter makes his way through the outer reaches, earning his keep as a bounty hunter."
    }
  }
];

// Filter function for mock data to simulate search
export function filterMockMovies(query: string, yearFilter?: number) {
  return mockMovies.filter(movie => {
    const matchesQuery = movie.title.toLowerCase().includes(query.toLowerCase());
    const matchesYear = yearFilter ? movie.year === yearFilter : true;
    return matchesQuery && matchesYear;
  });
}

export function filterMockSeries(query: string, yearFilter?: number) {
  return mockSeries.filter(series => {
    const matchesQuery = series.title.toLowerCase().includes(query.toLowerCase());
    const matchesYear = yearFilter ? series.year === yearFilter : true;
    return matchesQuery && matchesYear;
  });
}
