import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ExternalLink, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MyComment {
  id: string;
  post_id: string;
  reddit_post_id: string;
  final_response: string;
  entry_point_used: string;
  status: string;
  reddit_comment_id: string;
  submitted_at: string;
  created_at: string;
}

interface RedditPost {
  id: string;
  reddit_post_id: string;
  subreddit_name: string;
  title: string;
  author: string;
  score: number;
  num_comments: number;
  permalink: string;
  created_utc: string;
}

interface ActiveEngagementsProps {
  isConnected: boolean;
}

export function ActiveEngagements({ isConnected }: ActiveEngagementsProps) {
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [posts, setPosts] = useState<Record<string, RedditPost>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveEngagements();
  }, []);

  const loadActiveEngagements = async () => {
    setLoading(true);
    try {
      // Load submitted comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('reddit_my_comments')
        .select('*')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (commentsError) throw commentsError;

      const comments = commentsData || [];
      setMyComments(comments);

      // Load corresponding posts
      const postIds = [...new Set(comments.map(c => c.post_id))];
      if (postIds.length > 0) {
        const { data: postsData, error: postsError } = await supabase
          .from('reddit_posts')
          .select('*')
          .in('id', postIds);

        if (postsError) throw postsError;

        const postsMap: Record<string, RedditPost> = {};
        (postsData || []).forEach(post => {
          postsMap[post.id] = post;
        });
        setPosts(postsMap);
      }
    } catch (error) {
      console.error('Error loading active engagements:', error);
      toast({
        title: "Error",
        description: "Failed to load active engagements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdatedComments = async (postId: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Reddit API connection required",
        variant: "destructive",
      });
      return;
    }

    try {
      const post = Object.values(posts).find(p => p.id === postId);
      if (!post) return;

      const { data, error } = await supabase.functions.invoke('reddit-api', {
        body: { 
          action: 'fetch_post_comments',
          data: {
            subreddit: post.subreddit_name,
            postId: post.reddit_post_id
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Fetched ${data.comments?.length || 0} comments from the thread`,
      });
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch comments",
        variant: "destructive",
      });
    }
  };

  const getEngagementStats = () => {
    const totalEngagements = myComments.length;
    const uniquePosts = new Set(myComments.map(c => c.post_id)).size;
    const uniqueSubreddits = new Set(
      myComments.map(c => posts[c.post_id]?.subreddit_name).filter(Boolean)
    ).size;

    return { totalEngagements, uniquePosts, uniqueSubreddits };
  };

  const stats = getEngagementStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalEngagements}</p>
                <p className="text-xs text-muted-foreground">Active Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.uniquePosts}</p>
                <p className="text-xs text-muted-foreground">Posts Engaged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Badge className="h-8 w-8 flex items-center justify-center">
                r/
              </Badge>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.uniqueSubreddits}</p>
                <p className="text-xs text-muted-foreground">Subreddits Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Engagements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Active Comment Threads ({myComments.length})
            </span>
            <Button variant="outline" size="sm" onClick={loadActiveEngagements} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Track your submitted comments and ongoing Reddit conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myComments.length === 0 ? (
            <Alert>
              <AlertDescription>
                No active engagements yet. Submit comments from the Response Generator to start tracking.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {myComments.map((comment) => {
                  const post = posts[comment.post_id];
                  return (
                    <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                      {/* Post Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {post?.title || 'Loading post...'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              r/{post?.subreddit_name || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by u/{post?.author}
                            </span>
                            {post && (
                              <span className="text-xs text-muted-foreground">
                                {post.score} upvotes • {post.num_comments} comments
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchUpdatedComments(comment.post_id)}
                            disabled={!isConnected}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {post && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Entry Point Used */}
                      <div className="bg-muted p-3 rounded text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Critical Thinking Angle:</p>
                        <p>{comment.entry_point_used}</p>
                      </div>

                      {/* My Comment */}
                      <div className="bg-accent/50 p-3 rounded text-sm">
                        <p className="text-xs text-muted-foreground mb-1">My Response:</p>
                        <p className="line-clamp-3">{comment.final_response}</p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Submitted {new Date(comment.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        {comment.reddit_comment_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {comment.reddit_comment_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}