'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function TerminalHeader() {
  const [cursor, setCursor] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState('establishing connection...');
  
  // Blink the cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  // Simulate connection sequence
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsConnected(true);
      setStatusText('connection established');
    }, 1500);
    return () => clearInterval(timeout);
  }, []);
  
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="bg-black text-green-500 font-mono text-sm border-b border-green-500/30 overflow-hidden">
      <div className="container mx-auto py-1 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">user@torrents:~$</span>
          <span className={isConnected ? 'text-green-500' : 'text-yellow-500'}>
            {statusText}
          </span>
          <span className="ml-1 text-white">{cursor ? '█' : ' '}</span>
          {isConnected && (
            <span className="text-gray-500 ml-2">
              <span className="text-blue-400">[</span>
              <span className="text-purple-400">secure</span>
              <span className="text-blue-400">]</span>
            </span>
          )}
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/movies" className="text-gray-400 hover:text-green-400 transition-colors">
            <span className="text-gray-500">~$</span> movies
          </Link>
          <Link href="/series" className="text-gray-400 hover:text-green-400 transition-colors">
            <span className="text-gray-500">~$</span> series
          </Link>
          <div className="text-gray-500">
            <span className="text-yellow-500">{currentTime}</span> | <span className="text-green-500 animate-pulse">●</span> online
          </div>
        </div>
      </div>
      
      {/* Cool ASCII art divider that's subtle but adds character */}
      <div className="text-green-800 text-[0.6rem] leading-none opacity-30 select-none overflow-hidden whitespace-nowrap">
        {'░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░'.repeat(5)}
      </div>
    </div>
  );
}
