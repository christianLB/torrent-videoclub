import React from 'react';

interface DownloadIndicatorProps {
  progress?: number;
}

const DownloadIndicator: React.FC<DownloadIndicatorProps> = ({ progress = 0 }) => {
  return (
    <div className="flex items-center space-x-1">
      <div className="relative w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-blue-400">{progress}%</span>
    </div>
  );
};

export default DownloadIndicator;
