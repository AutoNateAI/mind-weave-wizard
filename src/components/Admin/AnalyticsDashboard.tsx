import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Users, MapPin, MessageSquare, Heart, Share, Target } from 'lucide-react';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import { supabase } from '@/integrations/supabase/client';

interface KeywordTrend {
  keyword: string;
  count: number;
  sentiment: number;
  engagement: number;
  growth: number;
}

interface LocationInsight {
  location: string;
  profiles: number;
  posts: number;
  avgSentiment: number;
  topKeywords: string[];
}

export const AnalyticsDashboard: React.FC = () => {
  const { heatmapData, loading } = useHeatmapData();
  const [keywordTrends, setKeywordTrends] = useState<KeywordTrend[]>([]);
  const [locationInsights, setLocationInsights] = useState<LocationInsight[]>([]);
  const [actualStats, setActualStats] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalKeywords: 0,
    totalProfiles: 0,
    totalPosts: 0,
    avgSentiment: 0
  });

  useEffect(() => {
    if (heatmapData.length > 0) {
      generateAnalytics();
    }
  }, [heatmapData, actualStats]);

  const generateAnalytics = async () => {
    // Generate keyword trends
    const keywordMap = new Map<string, { count: number; sentiments: number[]; engagement: number; }>();
    
    heatmapData.forEach(point => {
      if (!keywordMap.has(point.keyword)) {
        keywordMap.set(point.keyword, { count: 0, sentiments: [], engagement: 0 });
      }
      const data = keywordMap.get(point.keyword)!;
      data.count += point.density_score;
      data.sentiments.push(point.sentiment_avg);
      data.engagement += point.engagement_score;
    });

    const trends = Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        sentiment: data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length,
        engagement: data.engagement,
        growth: Math.random() * 40 - 20 // Simulated growth %
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setKeywordTrends(trends);

    // Generate location insights - fetch actual company names
    if (!actualStats) {
      try {
        // Get actual profile/post counts by company  
        const { data } = await supabase
          .from('keywords_analytics')
          .select('location_name, source_type, source_id');
        
        if (data) {
          const locationMap = new Map<string, { profiles: Set<string>; posts: Set<string>; }>();
          
          data.forEach(item => {
            const location = item.location_name || 'Unknown';
            if (!locationMap.has(location)) {
              locationMap.set(location, { profiles: new Set(), posts: new Set() });
            }
            const locData = locationMap.get(location)!;
            
            // Count unique sources by type
            if (item.source_type === 'profile') {
              locData.profiles.add(item.source_id);
            } else {
              locData.posts.add(item.source_id);
            }
          });
          
          // Now get the heatmap data for each location
          const locationInsightsTemp = Array.from(locationMap.entries())
            .map(([location, data]) => {
              const locationHeatmapPoints = heatmapData.filter(p => p.location_name === location);
              const sentiments = locationHeatmapPoints.map(p => p.sentiment_avg);
              const keywords = new Set(locationHeatmapPoints.map(p => p.keyword));
              
              return {
                location,
                profiles: data.profiles.size,
                posts: data.posts.size,
                avgSentiment: sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0,
                topKeywords: Array.from(keywords).slice(0, 3) as string[]
              };
            })
            .sort((a, b) => b.profiles - a.profiles)
            .slice(0, 8);
            
          setLocationInsights(locationInsightsTemp);
          setActualStats(true);
        }
      } catch (error) {
        console.error('Error fetching location analytics:', error);
      }
    }

    // Calculate total stats
    const totalKeywords = new Set(heatmapData.map(p => p.keyword)).size;
    const totalProfiles = heatmapData.reduce((sum, p) => sum + p.profile_count, 0);
    const totalPosts = heatmapData.reduce((sum, p) => sum + p.post_count, 0);
    const avgSentiment = heatmapData.reduce((sum, p) => sum + p.sentiment_avg, 0) / heatmapData.length;

    setTotalStats({
      totalKeywords,
      totalProfiles,
      totalPosts,
      avgSentiment: avgSentiment || 0
    });
  };

  const chartConfig = {
    count: {
      label: "Frequency",
      color: "hsl(var(--primary))",
    },
    engagement: {
      label: "Engagement",
      color: "hsl(var(--secondary))",
    },
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'text-green-600';
    if (sentiment < -0.2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.2) return 'Positive';
    if (sentiment < -0.2) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Insights from your LinkedIn network attention data
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalKeywords}</div>
            <p className="text-xs text-muted-foreground">Unique topics tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalProfiles}</div>
            <p className="text-xs text-muted-foreground">LinkedIn connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">Posts analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSentimentColor(totalStats.avgSentiment)}`}>
              {getSentimentLabel(totalStats.avgSentiment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(totalStats.avgSentiment * 100).toFixed(1)}% sentiment score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Keyword Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Trending Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="keyword" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Location Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationInsights.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{location.location}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{location.profiles} profiles</span>
                      <span>{location.posts} posts</span>
                      <span className={getSentimentColor(location.avgSentiment)}>
                        {getSentimentLabel(location.avgSentiment)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {location.topKeywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keyword Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keywordTrends.slice(0, 5).map((trend, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{trend.keyword}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {trend.count} mentions
                      </span>
                      <div className="flex items-center gap-1">
                        {trend.growth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${trend.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(trend.growth).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(trend.count / keywordTrends[0].count) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Engagement: {trend.engagement}</span>
                    <span className={getSentimentColor(trend.sentiment)}>
                      {getSentimentLabel(trend.sentiment)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};