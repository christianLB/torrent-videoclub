'use client';

import { useState, useEffect } from 'react';

// Hacker-style loading messages
const loadingMessages = [
  'Establishing secure connection',
  'Scanning network',
  'Bypassing firewall',
  'Decrypting data blocks',
  'Accessing trackers',
  'Parsing metadata',
  'Analyzing media signatures',
  'Verifying authenticity',
  'Initializing torrent stream',
  'Fetching peer list',
  'Connecting to swarm',
  'Downloading chunks',
  'Buffering video data',
  'Optimizing playback',
  'Almost there...',
  'Loading complete!'
];

interface HackerLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function HackerLoadingSpinner({ 
  size = 'medium',
  message = 'Decrypting data'
}: HackerLoadingSpinnerProps) {
  const [dots, setDots] = useState('.');
  const [loadingText, setLoadingText] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  // Size classes mapping
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  
  const containerClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };
  
  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 300);
    return () => clearInterval(interval);
  }, []);
  
  // Animate the progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue(prev => {
        // Make it slightly non-linear for a more realistic feel
        const increment = Math.random() * 3 + (100 - prev) / 20;
        return Math.min(prev + increment, 99);
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  // Cycle through status messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setStatusText(randomMessage);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Animate the loading text with a "typing" effect
  useEffect(() => {
    if (!message) return;
    
    let currentText = '';
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= message.length) {
        clearInterval(interval);
        return;
      }
      
      currentText += message[index];
      setLoadingText(currentText);
      index++;
    }, 50);
    
    return () => clearInterval(interval);
  }, [message]);
  
  return (
    <div className={`flex flex-col items-center ${containerClasses[size]}`}>
      <div className="mb-3 relative">
        {/* Matrix-style falling code background */}
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-30">
          <div className="w-full h-full bg-black flex items-center justify-center text-green-500 font-mono animate-pulse">
            {Math.floor(progressValue)}%
          </div>
        </div>
        
        {/* The spinner */}
        <svg className={`${sizeClasses[size]} text-green-500 animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      {/* Progress bar with hacker aesthetic */}
      <div className="w-full max-w-xs h-1.5 bg-green-950 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-200"
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
      
      {/* Terminal-style status text */}
      <div className="font-mono text-green-500">
        <div className="flex items-center justify-center">
          <span className="text-gray-500 mr-1">$</span>
          <span className="text-green-400">{loadingText || message}</span>
          <span className="text-green-400">{dots}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {statusText}
        </div>
      </div>
    </div>
  );
}
