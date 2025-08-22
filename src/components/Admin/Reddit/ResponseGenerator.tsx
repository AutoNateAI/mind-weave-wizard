import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Bot, Send, Edit3, ExternalLink, Lightbulb } from 'lucide-react';
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
  permalink: string;
  ai_summary: string;
  keywords: any[];
  topics: any[];
  entry_points: any[];
  analyzed_at: string;
}

interface MyComment {
  id: string;
  post_id: string;
  reddit_post_id: string;
  generated_response: string;
  final_response: string;
  entry_point_used: string;
  status: string;
  created_at: string;
}

interface ResponseGeneratorProps {
  isConnected: boolean;
}

const CURRICULUM_CONTEXT = `
AutoNateAI's "Thinking Wizard" Course teaches critical thinking through:

1. Graph Theory & Mental Models - Understanding connections and relationships
2. Pattern Recognition - Identifying recurring themes and structures  
3. Multiple Perspectives - Seeing problems from different angles
4. Research Decomposition - Breaking complex topics into manageable parts
5. Traversal Techniques - Systematic approaches to exploring ideas
6. Professional Integration - Applying thinking skills in real-world contexts

Our approach: Help people develop structured thinking while being genuinely supportive and never pushy or salesy.
`;

export function ResponseGenerator({ isConnected }: ResponseGeneratorProps) {
  const [analyzedPosts, setAnalyzedPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [selectedEntryPoint, setSelectedEntryPoint] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [finalResponse, setFinalResponse] = useState('');
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyzedPosts();
    loadMyComments();
  }, []);

  const loadAnalyzedPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reddit_posts')
        .select('*')
        .not('analyzed_at', 'is', null)
        .not('entry_points', 'eq', '[]')
        .order('created_utc', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnalyzedPosts((data || []).map(post => ({
        ...post,
        keywords: Array.isArray(post.keywords) ? post.keywords : [],
        topics: Array.isArray(post.topics) ? post.topics : [],
        entry_points: Array.isArray(post.entry_points) ? post.entry_points : []
      })));
    } catch (error) {
      console.error('Error loading analyzed posts:', error);
      toast({
        title: "Error",
        description: "Failed to load analyzed posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMyComments = async () => {
    try {
      const { data, error } = await supabase
        .from('reddit_my_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyComments(data || []);
    } catch (error) {
      console.error('Error loading my comments:', error);
    }
  };

  const generateResponse = async () => {
    if (!selectedPost || !selectedEntryPoint) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('reddit-analyzer', {
        body: { 
          action: 'generate_response',
          data: {
            postContent: selectedPost.content,
            postTitle: selectedPost.title,
            entryPoint: selectedEntryPoint,
            curriculum: CURRICULUM_CONTEXT
          }
        }
      });

      if (error) throw error;

      setGeneratedResponse(data.generatedResponse);
      setFinalResponse(data.generatedResponse);
      
      toast({
        title: "Success",
        description: "Response generated successfully",
      });
    } catch (error: any) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveComment = async () => {
    if (!selectedPost || !finalResponse || !selectedEntryPoint) return;

    try {
      const { error } = await supabase
        .from('reddit_my_comments')
        .insert({
          post_id: selectedPost.id,
          reddit_post_id: selectedPost.reddit_post_id,
          generated_response: generatedResponse,
          final_response: finalResponse,
          entry_point_used: selectedEntryPoint,
          status: 'draft',
        });

      if (error) throw error;

      loadMyComments();
      
      // Clear the form
      setSelectedPost(null);
      setSelectedEntryPoint('');
      setGeneratedResponse('');
      setFinalResponse('');
      
      toast({
        title: "Success",
        description: "Comment saved as draft",
      });
    } catch (error: any) {
      console.error('Error saving comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save comment",
        variant: "destructive",
      });
    }
  };

  const submitToReddit = async (comment: MyComment) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Reddit API connection required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reddit-api', {
        body: { 
          action: 'submit_comment',
          data: {
            thingId: `t3_${comment.reddit_post_id}`, // Reddit format for post ID
            text: comment.final_response
          }
        }
      });

      if (error) throw error;

      // Update comment status
      await supabase
        .from('reddit_my_comments')
        .update({
          status: 'submitted',
          reddit_comment_id: data.comment_id,
          submitted_at: new Date().toISOString(),
          submission_response: JSON.stringify(data.result)
        })
        .eq('id', comment.id);

      loadMyComments();
      
      toast({
        title: "Success",
        description: "Comment submitted to Reddit!",
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (commentId: string, newResponse: string) => {
    try {
      const { error } = await supabase
        .from('reddit_my_comments')
        .update({ 
          final_response: newResponse,
          status: 'edited'
        })
        .eq('id', commentId);

      if (error) throw error;

      loadMyComments();
      
      toast({
        title: "Success",
        description: "Comment updated",
      });
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Generate Response
            </CardTitle>
            <CardDescription>
              Create thoughtful responses that promote critical thinking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Post Selection */}
            <div className="space-y-2">
              <Label>Select Analyzed Post</Label>
              <ScrollArea className="h-[200px] border rounded p-2">
                <div className="space-y-2">
                  {analyzedPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        selectedPost?.id === post.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => {
                        setSelectedPost(post);
                        setSelectedEntryPoint('');
                        setGeneratedResponse('');
                        setFinalResponse('');
                      }}
                    >
                      <h4 className="text-sm font-medium line-clamp-2">{post.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">r/{post.subreddit_name}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {post.entry_points.length} entry points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Entry Point Selection */}
            {selectedPost && (
              <div className="space-y-2">
                <Label>Choose Entry Point</Label>
                <Select value={selectedEntryPoint} onValueChange={setSelectedEntryPoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a critical thinking angle" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPost.entry_points.map((point, idx) => (
                      <SelectItem key={idx} value={point}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateResponse}
              disabled={!selectedPost || !selectedEntryPoint || generating}
              className="w-full"
            >
              <Bot className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Response'}
            </Button>

            {/* Generated Response */}
            {generatedResponse && (
              <div className="space-y-2">
                <Label>Generated Response</Label>
                <Textarea
                  value={finalResponse}
                  onChange={(e) => setFinalResponse(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Edit the generated response..."
                />
                <div className="flex gap-2">
                  <Button onClick={saveComment} disabled={!finalResponse}>
                    Save as Draft
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFinalResponse(generatedResponse)}
                  >
                    Reset to Generated
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Comments ({myComments.length})
            </CardTitle>
            <CardDescription>
              Manage your drafted and submitted responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {myComments.map((comment) => {
                  const post = analyzedPosts.find(p => p.id === comment.post_id);
                  return (
                    <div key={comment.id} className="p-4 border rounded-lg">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-2">
                            {post?.title || 'Post not found'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              r/{post?.subreddit_name}
                            </Badge>
                            <Badge 
                              variant={comment.status === 'submitted' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {comment.status}
                            </Badge>
                          </div>
                        </div>
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

                      {/* Entry Point */}
                      <div className="mb-2">
                        <Label className="text-xs text-muted-foreground">Entry Point Used:</Label>
                        <p className="text-xs bg-muted p-2 rounded mt-1">
                          {comment.entry_point_used}
                        </p>
                      </div>

                      {/* Comment Text */}
                      <div className="mb-3">
                        <Textarea
                          value={comment.final_response}
                          onChange={(e) => updateComment(comment.id, e.target.value)}
                          className="text-sm"
                          disabled={comment.status === 'submitted'}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {comment.status !== 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => submitToReddit(comment)}
                            disabled={submitting || !isConnected}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit to Reddit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {comment.status === 'submitted' ? 'Submitted' : 'Draft'}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {myComments.length === 0 && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      Generate your first response above to get started with Reddit engagement.
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