import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeatmapPoint {
  id: string;
  location_latitude: number;
  location_longitude: number;
  location_name: string | null;
  keyword: string;
  density_score: number;
  engagement_score: number;
  sentiment_avg: number;
  profile_count: number;
  post_count: number;
  date_snapshot: string;
}

export interface HeatmapFilters {
  keywords: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sentimentRange: {
    min: number;
    max: number;
  };
  engagementThreshold: number;
}

export const useHeatmapData = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HeatmapFilters>({
    keywords: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0], // today
    },
    sentimentRange: { min: -1, max: 1 },
    engagementThreshold: 0,
  });

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attention_heatmap_data')
        .select('id, location_latitude, location_longitude, keyword, density_score, engagement_score, sentiment_avg, profile_count, post_count, date_snapshot')
        .gte('date_snapshot', filters.dateRange.start)
        .lte('date_snapshot', filters.dateRange.end)
        .gte('sentiment_avg', filters.sentimentRange.min)
        .lte('sentiment_avg', filters.sentimentRange.max)
        .gte('engagement_score', filters.engagementThreshold);

      if (filters.keywords.length > 0) {
        query = query.in('keyword', filters.keywords);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching heatmap data:', error);
        return;
      }

      // Map the data to include location_name as null since it's not in the table
      const mappedData = (data || []).map(item => ({
        ...item,
        location_name: null
      }));

      setHeatmapData(mappedData);
    } catch (error) {
      console.error('Error in fetchHeatmapData:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const triggerAnalysis = async (action: 'process_profiles' | 'process_posts' | 'generate_heatmap' | 'full_analysis') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-keyword-analyzer', {
        body: { action, batch_size: 20 }
      });

      if (error) {
        console.error('Error triggering analysis:', error);
        return { success: false, error };
      }

      // Refresh heatmap data after analysis
      await fetchHeatmapData();
      return { success: true, data };
    } catch (error) {
      console.error('Error in triggerAnalysis:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getTopKeywords = useCallback(() => {
    const keywordCounts = new Map<string, number>();
    
    heatmapData.forEach(point => {
      const count = keywordCounts.get(point.keyword) || 0;
      keywordCounts.set(point.keyword, count + point.density_score);
    });

    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);
  }, [heatmapData]);

  const getHeatmapLayers = useCallback(() => {
    if (heatmapData.length === 0) return { density: [], engagement: [], sentiment: [] };

    // Group data for different layer types
    const densityLayer = heatmapData.map(point => ({
      coordinates: [point.location_longitude, point.location_latitude] as [number, number],
      weight: point.density_score,
      keyword: point.keyword,
      details: point
    }));

    const engagementLayer = heatmapData
      .filter(point => point.engagement_score > 0)
      .map(point => ({
        coordinates: [point.location_longitude, point.location_latitude] as [number, number],
        weight: Math.log(point.engagement_score + 1), // Log scale for better visualization
        keyword: point.keyword,
        details: point
      }));

    const sentimentLayer = heatmapData.map(point => ({
      coordinates: [point.location_longitude, point.location_latitude] as [number, number],
      weight: Math.abs(point.sentiment_avg), // Intensity of sentiment
      sentiment: point.sentiment_avg,
      keyword: point.keyword,
      details: point
    }));

    return { density: densityLayer, engagement: engagementLayer, sentiment: sentimentLayer };
  }, [heatmapData]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  return {
    heatmapData,
    loading,
    filters,
    setFilters,
    triggerAnalysis,
    getTopKeywords,
    getHeatmapLayers,
    refreshData: fetchHeatmapData
  };
};