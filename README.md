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

Create a `.env.local` file in the root directory with the following variables:

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
