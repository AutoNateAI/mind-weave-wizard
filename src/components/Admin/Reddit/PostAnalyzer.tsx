import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Bot, MessageSquare, TrendingUp, ThumbsUp, Calendar, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedditPost {
  id: string;
  reddit_post_id: string;
  subreddit_name: string;
  title: string;
  content: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: string;
  permalink: string;
  ai_summary: string;
  keywords: any[];
  topics: any[];
  sentiment_score: number;
  sentiment_label: string;
  entry_points: any[];
  analyzed_at: string;
}

interface PostAnalyzerProps {
  isConnected: boolean;
}

export function PostAnalyzer({ isConnected }: PostAnalyzerProps) {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    loadSubreddits();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reddit_posts')
        .select('*')
        .order('created_utc', { ascending: false })
        .limit(50);

      if (selectedSubreddit !== 'all') {
        query = query.eq('subreddit_name', selectedSubreddit);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts((data || []).map(post => ({
        ...post,
        keywords: Array.isArray(post.keywords) ? post.keywords : [],
        topics: Array.isArray(post.topics) ? post.topics : [],
        entry_points: Array.isArray(post.entry_points) ? post.entry_points : []
      })));
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const analyzePost = async (post: RedditPost) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reddit-analyzer', {
        body: { 
          action: 'analyze_post',
          data: {
            postId: post.id,
            content: post.content,
            title: post.title
          }
        }
      });

      if (error) throw error;

      // Refresh the post data
      const { data: updatedPost, error: fetchError } = await supabase
        .from('reddit_posts')
        .select('*')
        .eq('id', post.id)
        .single();

      if (fetchError) throw fetchError;

      setSelectedPost({
        ...updatedPost,
        keywords: Array.isArray(updatedPost.keywords) ? updatedPost.keywords : [],
        topics: Array.isArray(updatedPost.topics) ? updatedPost.topics : [],
        entry_points: Array.isArray(updatedPost.entry_points) ? updatedPost.entry_points : []
      });
      loadPosts(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Post analysis completed",
      });
    } catch (error: any) {
      console.error('Error analyzing post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze post",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'bg-green-100 text-green-800';
    if (score < -0.1) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadPosts();
  }, [searchTerm, selectedSubreddit]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Posts to Analyze
          </CardTitle>
          <CardDescription>
            Search and filter Reddit posts for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Posts</Label>
              <Input
                id="search"
                placeholder="Search titles and content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subreddit">Filter by Subreddit</Label>
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Posts ({posts.length})</span>
              <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPost?.id === post.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">{post.title}</h4>
                        {post.analyzed_at && (
                          <Badge variant="outline" className="ml-2 shrink-0">
                            <Bot className="h-3 w-3 mr-1" />
                            Analyzed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">r/{post.subreddit_name}</Badge>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {post.score}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.num_comments}
                        </span>
                      </div>
                      
                      {post.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {posts.length === 0 && !loading && (
                  <Alert>
                    <AlertDescription>
                      No posts found. Try fetching posts from the Subreddits tab first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Post Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPost ? (
              <div className="space-y-6">
                {/* Post Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-3">{selectedPost.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">r/{selectedPost.subreddit_name}</Badge>
                    <span>by u/{selectedPost.author}</span>
                    <span>{new Date(selectedPost.created_utc).toLocaleDateString()}</span>
                  </div>
                  {selectedPost.content && (
                    <p className="text-sm bg-muted p-3 rounded">
                      {selectedPost.content}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-fit"
                  >
                    <a href={selectedPost.permalink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Reddit
                    </a>
                  </Button>
                </div>

                {/* Analysis Results */}
                {selectedPost.analyzed_at ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    {selectedPost.ai_summary && (
                      <div>
                        <Label className="text-sm font-medium">AI Summary</Label>
                        <p className="text-sm bg-muted p-3 rounded mt-1">
                          {selectedPost.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* Keywords & Topics */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPost.keywords.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Keywords</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPost.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPost.topics.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Topics</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPost.topics.map((topic, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sentiment */}
                    {selectedPost.sentiment_label && (
                      <div>
                        <Label className="text-sm font-medium">Sentiment</Label>
                        <div className="mt-1">
                          <Badge className={getSentimentColor(selectedPost.sentiment_score)}>
                            {selectedPost.sentiment_label} ({selectedPost.sentiment_score?.toFixed(2)})
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Entry Points */}
                    {selectedPost.entry_points.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Critical Thinking Entry Points</Label>
                        <ul className="mt-1 space-y-1 text-sm">
                          {selectedPost.entry_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      This post hasn't been analyzed yet
                    </p>
                    <Button
                      onClick={() => analyzePost(selectedPost)}
                      disabled={analyzing}
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </Button>
                  </div>
                )}

                {/* Re-analyze button */}
                {selectedPost.analyzed_at && (
                  <Button
                    variant="outline"
                    onClick={() => analyzePost(selectedPost)}
                    disabled={analyzing}
                    className="w-full"
                  >
                    {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a post from the list to view and analyze
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}