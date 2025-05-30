import React from 'react';

interface DownloadIndicatorProps {
  progress?: number;
  isProcessing?: boolean;
}

const DownloadIndicator: React.FC<DownloadIndicatorProps> = ({ progress = 0, isProcessing = false }) => {
  if (isProcessing) {
    return (
      <div className="flex items-center space-x-1 px-2 py-0.5 bg-gray-700 rounded-full">
        <svg className="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-blue-400">Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="relative w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-blue-400">{progress}%</span>
    </div>
  );
};

export default DownloadIndicator;
