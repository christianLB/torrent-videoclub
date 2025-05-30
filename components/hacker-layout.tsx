'use client';

import { ReactNode, useEffect, useState } from 'react';
import { TerminalHeader } from './terminal-header';
import Link from 'next/link';

interface HackerLayoutProps {
  children: ReactNode;
}

export function HackerLayout({ children }: HackerLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [bootSequence, setBootSequence] = useState(true);
  
  // Boot sequence animation
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setBootSequence(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Konami code easter egg
  useEffect(() => {
    if (!mounted) return;
    
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        
        if (konamiIndex === konamiCode.length) {
          // Activate matrix mode
          document.body.classList.toggle('matrix-mode');
          konamiIndex = 0;
          
          // Show easter egg notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-900 text-green-400 p-4 rounded font-mono z-50 animate-bounce';
          notification.textContent = 'HACKER MODE ACTIVATED';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.remove();
          }, 3000);
        }
      } else {
        konamiIndex = 0;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted]);

  if (bootSequence) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono text-green-500 overflow-hidden">
        <div className="space-y-4 max-w-lg w-full px-4">
          <div className="text-xl mb-8">TORRENT-OS v1.337</div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Initializing system kernel</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex justify-between">
              <span>Loading security protocols</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex justify-between">
              <span>Establishing network connection</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex justify-between">
              <span>Mounting file systems</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Loading interface</span>
              <span className="inline-block w-4 h-4 bg-green-500 animate-pulse rounded-full"></span>
            </div>
          </div>
          
          <div className="w-full bg-green-950 h-1.5 mt-8 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-pulse rounded-full transition-all duration-300" style={{ width: '90%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* <TerminalHeader /> */}
      
      <nav className="bg-gray-900 border-b border-green-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold font-mono text-green-500 flex items-center">
              <span className="pirate-flag mr-2 text-green-400" />
              <span className="glitch-text" data-text="TorrentClub">TorrentClub</span>
            </Link>
            
            <div className="flex space-x-6">
              <Link 
                href="/movies" 
                className="text-gray-300 hover:text-green-400 font-mono text-sm transition-colors flex items-center"
              >
                <span className="text-green-700 mr-1">&gt;</span> Movies
              </Link>
              <Link 
                href="/series" 
                className="text-gray-300 hover:text-green-400 font-mono text-sm transition-colors flex items-center"
              >
                <span className="text-green-700 mr-1">&gt;</span> Series
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 relative">
        {/* Subtle scanline effect */}
        <div className="scanlines absolute inset-0 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      <footer className="bg-gray-900 border-t border-green-900 py-4 text-xs text-gray-500 font-mono">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>TORRENT-OS v1.337 © {new Date().getFullYear()}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>CONNECTION SECURED</span>
            </div>
          </div>
          
          {/* Random hacker quotes that change on each page load */}
          <div className="text-center mt-2 text-green-800">
            {[
              "The quieter you become, the more you can hear.",
              "Knowledge is free. Information is power.",
              "There's no place like 127.0.0.1",
              "In a world of locked systems, the open-source man is king.",
              "Privacy is not a privilege, it's a right.",
              "The best way to predict the future is to create it.",
              "Crypto is freedom currency.",
              "I'm not hacking, I'm just faster than the GUI.",
            ][Math.floor(Math.random() * 8)]}
          </div>
        </div>
      </footer>
    </div>
  );
}
