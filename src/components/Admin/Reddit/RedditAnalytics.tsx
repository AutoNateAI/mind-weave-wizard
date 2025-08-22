import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, MessageSquare, Calendar, RefreshCw, Hash } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format } from "date-fns";

interface AnalyticsData {
  subreddit_name: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  content_type: string;
  time_period: string;
}

interface KeywordTrend {
  keyword: string;
  posts: number;
  comments: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
}

interface RedditAnalyticsProps {
  isConnected: boolean;
}

export function RedditAnalytics({ isConnected }: RedditAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    loadSubreddits();
  }, [selectedSubreddit, dateRange]);

  const loadSubreddits = async () => {
    try {
      const { data, error } = await supabase
        .from('reddit_subreddits')
        .select('subreddit_name')
        .eq('is_active', true);

      if (error) throw error;
      setSubreddits(data?.map(s => s.subreddit_name) || []);
    } catch (error) {
      console.error('Error loading subreddits:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reddit_analytics')
        .select('*')
        .gte('time_period', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('time_period', format(dateRange.to, 'yyyy-MM-dd'))
        .order('time_period', { ascending: false });

      if (selectedSubreddit !== 'all') {
        query = query.eq('subreddit_name', selectedSubreddit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // This would normally trigger analytics generation
      // For now, we'll analyze existing data to create analytics
      
      // Get all posts and comments with keywords
      const { data: posts, error: postsError } = await supabase
        .from('reddit_posts')
        .select('*')
        .not('keywords', 'eq', '[]')
        .gte('created_utc', dateRange.from.toISOString())
        .lte('created_utc', dateRange.to.toISOString());

      if (postsError) throw postsError;

      const { data: comments, error: commentsError } = await supabase
        .from('reddit_comments')
        .select('*')
        .not('keywords', 'eq', '[]')
        .gte('created_utc', dateRange.from.toISOString())
        .lte('created_utc', dateRange.to.toISOString());

      if (commentsError) throw commentsError;

      // Process analytics data
      const analyticsToInsert: any[] = [];
      const today = format(new Date(), 'yyyy-MM-dd');

      // Keyword analytics from posts
      const postKeywords: Record<string, Record<string, number>> = {};
      (posts || []).forEach(post => {
        if (!postKeywords[post.subreddit_name]) {
          postKeywords[post.subreddit_name] = {};
        }
        ((post.keywords as string[]) || []).forEach((keyword: string) => {
          postKeywords[post.subreddit_name][keyword] = 
            (postKeywords[post.subreddit_name][keyword] || 0) + 1;
        });
      });

      // Create analytics entries for keywords
      Object.entries(postKeywords).forEach(([subreddit, keywords]) => {
        Object.entries(keywords).forEach(([keyword, count]) => {
          analyticsToInsert.push({
            subreddit_name: subreddit,
            metric_type: 'keyword',
            metric_name: keyword,
            metric_value: count,
            content_type: 'post',
            time_period: today,
          });
        });
      });

      // Similar for comments
      const commentKeywords: Record<string, Record<string, number>> = {};
      (comments || []).forEach(comment => {
        // Get subreddit from post
        const post = (posts || []).find(p => p.reddit_post_id === comment.reddit_post_id);
        const subredditName = post?.subreddit_name || 'unknown';
        
        if (!commentKeywords[subredditName]) {
          commentKeywords[subredditName] = {};
        }
        ((comment.keywords as string[]) || []).forEach((keyword: string) => {
          commentKeywords[subredditName][keyword] = 
            (commentKeywords[subredditName][keyword] || 0) + 1;
        });
      });

      Object.entries(commentKeywords).forEach(([subreddit, keywords]) => {
        Object.entries(keywords).forEach(([keyword, count]) => {
          analyticsToInsert.push({
            subreddit_name: subreddit,
            metric_type: 'keyword',
            metric_name: keyword,
            metric_value: count,
            content_type: 'comment',
            time_period: today,
          });
        });
      });

      // Insert analytics
      if (analyticsToInsert.length > 0) {
        const { error } = await supabase
          .from('reddit_analytics')
          .upsert(analyticsToInsert, {
            onConflict: 'subreddit_name,metric_type,metric_name,content_type,time_period'
          });

        if (error) throw error;
      }

      loadAnalytics();
      
      toast({
        title: "Success",
        description: `Generated analytics for ${analyticsToInsert.length} metrics`,
      });
    } catch (error: any) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTopKeywords = (): KeywordTrend[] => {
    const keywordData: Record<string, { posts: number; comments: number }> = {};

    analytics
      .filter(a => a.metric_type === 'keyword')
      .forEach(item => {
        if (!keywordData[item.metric_name]) {
          keywordData[item.metric_name] = { posts: 0, comments: 0 };
        }
        if (item.content_type === 'post') {
          keywordData[item.metric_name].posts += item.metric_value;
        } else {
          keywordData[item.metric_name].comments += item.metric_value;
        }
      });

    return Object.entries(keywordData)
      .map(([keyword, data]) => ({
        keyword,
        posts: data.posts,
        comments: data.comments,
        total: data.posts + data.comments,
        trend: 'stable' as const, // Would calculate trend from historical data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  };

  const getSubredditStats = () => {
    const stats: Record<string, { posts: number; comments: number; keywords: Set<string> }> = {};

    analytics.forEach(item => {
      if (!stats[item.subreddit_name]) {
        stats[item.subreddit_name] = { posts: 0, comments: 0, keywords: new Set() };
      }
      
      if (item.metric_type === 'keyword') {
        if (item.content_type === 'post') {
          stats[item.subreddit_name].posts += item.metric_value;
        } else {
          stats[item.subreddit_name].comments += item.metric_value;
        }
        stats[item.subreddit_name].keywords.add(item.metric_name);
      }
    });

    return Object.entries(stats).map(([subreddit, data]) => ({
      subreddit,
      posts: data.posts,
      comments: data.comments,
      keywords: data.keywords.size,
      total: data.posts + data.comments,
    }));
  };

  const topKeywords = getTopKeywords();
  const subredditStats = getSubredditStats();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reddit Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Track keyword trends, topics, and engagement patterns across your tracked subreddits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subreddit</label>
              <Select value={selectedSubreddit} onValueChange={setSelectedSubreddit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subreddit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subreddits</SelectItem>
                  {subreddits.map((sub) => (
                    <SelectItem key={sub} value={sub}>r/{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="text-sm text-muted-foreground">Date picker coming soon</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button onClick={generateAnalytics} disabled={loading}>
                  Generate Analytics
                </Button>
                <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Top Keywords ({topKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {topKeywords.map((keyword, idx) => (
                  <div key={keyword.keyword} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="text-xs text-muted-foreground">
                          {keyword.posts} posts • {keyword.comments} comments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{keyword.total}</p>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {keyword.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {topKeywords.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      No keyword data available. Generate analytics first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Subreddit Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Subreddit Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {subredditStats.map((stat) => (
                  <div key={stat.subreddit} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">r/{stat.subreddit}</h4>
                      <Badge variant="outline">{stat.total} total</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="text-center">
                        <p className="font-medium">{stat.posts}</p>
                        <p>Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{stat.comments}</p>
                        <p>Comments</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{stat.keywords}</p>
                        <p>Keywords</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {subredditStats.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      No subreddit data available. Generate analytics first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}