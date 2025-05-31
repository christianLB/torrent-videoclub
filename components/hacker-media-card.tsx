'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HackerMediaCardProps {
  guid: string;
  title: string;
  year?: number;
  posterPath?: string | null;
  rating?: number;
  mediaType: 'movie' | 'series';
  quality?: string;
  seeders?: number;
  size?: string;
  tmdbId?: number;
  handleAddClick: (guid: string) => void;
}

export function HackerMediaCard({
  guid,
  title,
  year,
  posterPath,
  rating,
  mediaType,
  quality,
  seeders,
  size,
  handleAddClick,
}: HackerMediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    handleAddClick(guid);
    // Reset after animation
    setTimeout(() => setIsAdding(false), 2000);
  };

  // Display random "encrypted" data line
  const getRandomDataLine = () => {
    const patterns = [
      '0x7F38A2C1 0xFFD9E4B1',
      'SEED:// [CONNECTION ACTIVE]',
      'RLS_VER: 1.337.42',
      'AUTH: VERIFIED ✓',
      'ROUTE: ENCRYPTED',
      'SYS: ACTIVE [SECURE]',
      'NET: PING 23ms',
      'BUFFER: 100%',
      'TRACKERS: ONLINE',
      'NODE: ANONYMOUS',
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  // Calculate health indicator color based on seeders
  const getHealthColor = () => {
    if (!seeders || seeders === 0) return 'bg-red-500';
    if (seeders < 5) return 'bg-yellow-500';
    if (seeders < 20) return 'bg-green-500';
    return 'bg-emerald-400';
  };

  return (
    <div
      className="relative crt-effect group overflow-hidden bg-black border border-green-900/50 rounded-lg shadow-md transition-all hover:border-green-500/80 hover:shadow-lg hover:shadow-green-500/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Background - Gradient scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/40 to-black/60 scanlines" />
      
      {/* Media info overlay - appears on hover */}
      <div className={`absolute inset-0 bg-black/80 z-10 p-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'} flex flex-col justify-between overflow-y-auto`}>
        <div>
          <div className="text-green-400 font-mono text-xs mb-4 opacity-70">{getRandomDataLine()}</div>
          
          <h3 className="text-green-400 font-bold mb-1 font-mono">{title}</h3>
          {year && <p className="text-green-600 text-sm mb-2">{year}</p>}
          
          {quality && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">QUALITY:</span>
              <span className="text-xs text-green-500 bg-green-900/40 px-2 py-0.5 rounded">{quality}</span>
            </div>
          )}
          
          {size && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">SIZE:</span>
              <span className="text-xs text-green-500">{size}</span>
            </div>
          )}
          
          {seeders !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">SEEDERS:</span>
              <div className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${getHealthColor()}`}></span>
                <span className="text-xs text-green-500">{seeders}</span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className={`mt-4 w-full text-sm bg-green-900/60 hover:bg-green-800 text-green-400 font-mono py-1.5 rounded border border-green-500/30 transition-all hover:border-green-500 ${
            isAdding ? 'animate-pulse cursor-not-allowed' : ''
          }`}
        >
          {isAdding ? (
            <span className="flex justify-center items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              INITIALIZING...
            </span>
          ) : (
            <>
              <span className="mr-1 font-bold">+</span> ADD TO {mediaType === 'movie' ? 'RADARR' : 'SONARR'}
            </>
          )}
        </button>
      </div>
      
      {/* Bottom info bar - always visible */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-10 py-1 px-2 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-400 text-xs font-mono truncate max-w-[150px]">{title}</span>
        </div>
        {rating && (
          <div className="text-xs text-yellow-400 bg-yellow-900/40 px-1.5 rounded font-mono">
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Poster Image */}
      <div className="aspect-[2/3] overflow-hidden relative">
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${posterPath}`}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover grayscale-[0.2] scanlines"
            style={{ opacity: 0.9 }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-gray-700 font-mono text-sm">NO_IMAGE.DAT</div>
          </div>
        )}
        
        {/* Pirate flag icon for movies/series */}
        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
          <div className="text-green-500 pirate-flag" />
        </div>
      </div>
    </div>
  );
}
