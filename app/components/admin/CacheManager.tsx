'use client';

import { useState, useEffect } from 'react';
import { useCacheRefresh, useCacheHealth } from '@/lib/hooks/use-cache-refresh';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, RefreshCw, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CacheManager() {
  const { refreshFeatured, refreshCategory, clearAllCaches, isRefreshing, isClearing } = useCacheRefresh({
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Redis Cache Manager
          <Badge variant={isConnected ? "success" : "destructive"}>
            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage your Redis cache for featured content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {lastRefreshed ? (
            <p>Last refreshed: {lastRefreshed.toLocaleString()}</p>
          ) : (
            <p>Cache has not been refreshed yet</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleClear}
          disabled={isClearing || isRefreshing || !isConnected}
        >
          {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Clear Cache
        </Button>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing || isClearing || !isConnected}
        >
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Featured
        </Button>
      </CardFooter>
    </Card>
  );
}
