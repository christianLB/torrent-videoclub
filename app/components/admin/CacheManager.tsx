'use client';

import { useState, useEffect } from 'react';
import { useCacheRefresh, useCacheHealth } from '@/lib/hooks/use-cache-refresh';
// import { Button } from '@/app/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
// import { Badge } from '@/app/components/ui/badge';

export default function CacheManager() {
  const { refreshFeatured, clearAllCaches, isRefreshing, isClearing } = useCacheRefresh({
    onSuccess: () => checkHealth()
  });
  
  const { isConnected, isChecking, checkHealth } = useCacheHealth();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    checkHealth();
    // Check health status every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleRefresh = async () => {
    await refreshFeatured();
    setLastRefreshed(new Date());
  };

  const handleClear = async () => {
    await clearAllCaches();
    setLastRefreshed(new Date());
  };

  return (
    <div>
      <p>Cache Manager (UI temporarily disabled due to missing components)</p>
      <button onClick={handleClear} disabled={isClearing || isRefreshing || !isConnected}>
        {isClearing ? 'Clearing...' : 'Clear Cache'}
      </button>
      <button onClick={handleRefresh} disabled={isRefreshing || isClearing || !isConnected}>
        {isRefreshing ? 'Refreshing...' : 'Refresh Featured'}
      </button>
      <p>{isChecking ? 'Checking cache status...' : isConnected ? 'Cache Service: Online' : 'Cache Service: Offline'}</p>
      {lastRefreshed && <p>Last refreshed: {lastRefreshed.toLocaleString()}</p>}
    </div>
  );
}
