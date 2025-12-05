import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchHit {
  objectID: string;
  id: string;
  type: 'event' | 'club';
  name: string;
  description?: string;
  city: string;
  // Event specific
  eventType?: string;
  locationName?: string;
  locationAddress?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  coverImage?: string;
  isFeatured?: boolean;
  // Club specific
  venueType?: string;
  address?: string;
  rating?: number;
  priceLevel?: number;
  photo?: string;
  googleMapsUri?: string;
  // Highlighting
  _highlightResult?: Record<string, { value: string; matchLevel: string }>;
}

export interface SearchFilters {
  type?: 'event' | 'club';
  city?: string;
  eventType?: string;
}

export interface SearchResult {
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

export const useAlgoliaSearch = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    filters?: SearchFilters,
    page: number = 0,
    hitsPerPage: number = 20
  ) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('algolia-search', {
        body: { query, filters, page, hitsPerPage },
      });

      if (fnError) throw fnError;

      setResults(data);
      return data;
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
};
