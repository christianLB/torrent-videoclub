# Torrent Videoclub - Curador Visual

![Next.js](https://img.shields.io/badge/Next.js-13.4+-000000?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Torrent Videoclub is a visual curator application for discovering, filtering, and adding movies and TV series from trackers connected to arr-stack (Radarr, Sonarr, Prowlarr). It provides an intuitive interface to search for media content, view detailed information, and seamlessly add it to your Radarr/Sonarr instances for automatic downloading and organization.

## Features

- 🎬 **Movie & TV Series Discovery**: Search and browse movies and TV series from trackers connected to Prowlarr
- 🔍 **Advanced Filtering**: Filter content by genre, year, rating, and quality
- 🌐 **TMDb Integration**: Enrich torrent data with metadata from The Movie Database (TMDb)
- 🔄 **Seamless Integration**: Add media directly to Radarr or Sonarr with one click
- 🎨 **Modern UI**: Beautiful and responsive interface built with Tailwind CSS and Shadcn UI
- 🌙 **Dark/Light Mode**: Choose between light and dark themes to match your preference
- 📱 **Mobile Friendly**: Fully responsive design for all screen sizes

## Prerequisites

To run this application, you need to have the following services configured:

- [Prowlarr](https://github.com/Prowlarr/Prowlarr) - For searching and indexing torrents
- [Radarr](https://github.com/Radarr/Radarr) - For managing movies
- [Sonarr](https://github.com/Sonarr/Sonarr) - For managing TV series
- [TMDb API Key](https://developers.themoviedb.org/3/getting-started/introduction) - For fetching media metadata

## Environment Variables

The project includes an `env.template` file that lists all required environment variables. To set up your environment:

1. Copy the `env.template` file to `.env.local`:

```bash
cp env.template .env.local
```

2. Edit the `.env.local` file with your actual API keys and URLs:

```bash
# API Keys and URLs
PROWLARR_URL=http://your-prowlarr-instance:9696
PROWLARR_API_KEY=your-prowlarr-api-key

TMDB_API_KEY=your-tmdb-api-key

RADARR_URL=http://your-radarr-instance:7878
RADARR_API_KEY=your-radarr-api-key

SONARR_URL=http://your-sonarr-instance:8989
SONARR_API_KEY=your-sonarr-api-key
```

**Note**: The `.env.local` file is automatically excluded from git, so your API keys will remain private.

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/torrent-videoclub.git
cd torrent-videoclub

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Instructions

### Searching for Movies/Series
1. Navigate to the Movies or Series page using the navigation menu at the top of the application.
2. Enter your search query in the search bar and click the "Search" button.
3. Results will be displayed as cards with poster images, titles, and relevant information.

### Filtering Results
1. After performing a search, use the filter bar at the top of the results to refine your search:
   - **Genre**: Filter by specific genres (Action, Drama, Comedy, etc.)
   - **Year**: Filter by release year
   - **Rating**: Filter by minimum rating (7+, 8+, 9+)
   - **Resolution**: Filter by video quality (480p, 720p, 1080p, 4K)

### Viewing Detailed Information
1. Click on any movie or series card to open a detailed view.
2. The detailed view provides additional information including:
   - Full synopsis/overview
   - Cast and crew (when available)
   - Runtime/number of seasons
   - Genres
   - Rating
   - Release date

### Adding to Radarr/Sonarr
1. To add a movie to Radarr, click the "Add to Radarr" button on the movie card or in the detailed view.
2. To add a series to Sonarr, click the "Add to Sonarr" button on the series card or in the detailed view.
3. A notification will appear confirming the successful addition or indicating any errors.

### Switching Between Light and Dark Mode
1. Click the theme toggle button in the top-right corner of the application.
2. The interface will switch between light and dark mode based on your selection.

### Mobile Usage
- The application is fully responsive and works on mobile devices.
- On smaller screens, the layout will adjust to provide an optimal viewing experience.
- All features are available on mobile, including searching, filtering, and adding content.

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Development

This project follows a strict Test-Driven Development (TDD) approach. All new features should be developed by writing tests first, then implementing the feature to make the tests pass.

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: React hooks and context
- **API Integration**: Native fetch API with custom client classes
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration tests
- **Theme Switching**: [next-themes](https://github.com/pacocoursey/next-themes) for dark/light mode

## Project Structure

```
├── app/              # Next.js App Router pages and layouts
│   ├── api/          # API routes for backend functionality
│   ├── movies/       # Movies page
│   └── series/       # TV Series page
├── components/       # React components
│   ├── ui/           # Base UI components (Shadcn)
│   └── ...           # Custom components
├── lib/              # Utility functions and API clients
│   └── api/          # API client implementations
└── test/             # Test files following the same structure
```

## Contributing

1. Write tests for your feature/fix
2. Implement the feature/fix
3. Make sure all tests pass
4. Submit a pull request

## License

MIT
