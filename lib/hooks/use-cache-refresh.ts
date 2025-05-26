/**
 * React hook for cache refresh functionality
 */
import { useState, useCallback } from 'react';
import { CacheAPIClient } from '../services/cache-api-client';

// Simple toast implementation to avoid sonner dependency for now
const toast = {
  success: (message: string) => {
    console.log(`✅ ${message}`);
    // You can add UI toast implementation later
  },
  error: (message: string) => {
    console.error(`❌ ${message}`);
    // You can add UI toast implementation later
  },
  info: (message: string) => {
    console.info(`ℹ️ ${message}`);
    // You can add UI toast implementation later
  }
};

export interface UseCacheRefreshOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCacheRefresh(options: UseCacheRefreshOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDirectClearing, setIsDirectClearing] = useState(false);

  const refreshFeatured = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await CacheAPIClient.refreshFeaturedContent();
      
      if (result.success) {
        toast.success('Featured content refreshed successfully');
        options.onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to refresh featured content');
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      options.onError?.(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [options]);

  const refreshCategory = useCallback(async (categoryId: string) => {
    setIsRefreshing(true);
    try {
      const result = await CacheAPIClient.refreshCategory(categoryId);
      
      if (result.success) {
        toast.success(`Category ${categoryId} refreshed successfully`);
        options.onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to refresh category');
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      options.onError?.(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [options]);

  const clearAllCaches = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await CacheAPIClient.clearAllCaches();
      
      if (result.success) {
        toast.success('All caches cleared successfully');
        options.onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to clear caches');
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      options.onError?.(err);
    } finally {
      setIsClearing(false);
    }
  }, [options]);

  const triggerBackgroundRefresh = useCallback(() => {
    CacheAPIClient.triggerBackgroundRefresh();
    toast.info('Background refresh triggered');
  }, []);

  const clearCache = useCallback(async () => {
    setIsDirectClearing(true);
    try {
      const result = await CacheAPIClient.clearCache();
      
      if (result.success) {
        toast.success('Cache cleared successfully');
        options.onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to clear cache');
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      options.onError?.(err);
    } finally {
      setIsDirectClearing(false);
    }
  }, [options]);

  return {
    refreshFeatured,
    refreshCategory,
    clearAllCaches,
    clearCache,
    triggerBackgroundRefresh,
    isRefreshing,
    isClearing,
    isDirectClearing,
    isLoading: isRefreshing || isClearing || isDirectClearing,
  };
}

// Hook for checking cache health
export function useCacheHealth() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await CacheAPIClient.checkCacheHealth();
      setIsConnected(result.connected ?? false);
      return result;
    } catch (error) {
      setIsConnected(false);
      return { connected: false, error: (error as Error).message };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isConnected,
    isChecking,
    checkHealth,
  };
}
