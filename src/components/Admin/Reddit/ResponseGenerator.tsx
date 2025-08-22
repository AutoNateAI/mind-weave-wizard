import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Bot, Send, Edit3, ExternalLink, Lightbulb, ThumbsUp, User } from 'lucide-react';
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

interface RedditComment {
  id: string;
  reddit_comment_id: string;
  reddit_post_id: string;
  author: string;
  content: string;
  score: number;
  created_utc: string;
  depth: number;
  permalink: string;
  is_submitter: boolean;
  ai_summary?: string;
  keywords?: any[];
  topics?: any[];
  sentiment_score?: number;
  sentiment_label?: string;
  analyzed_at?: string;
  suggestion?: {
    priority: number;
    reason: string;
    approach: string;
    key_points: string[];
  };
}

interface RedditCommentThread {
  root_comment: RedditComment;
  thread_comments: RedditComment[];
  post: RedditPost;
  analyzed_at?: string;
  ai_summary?: string;
  keywords?: any[];
  topics?: any[];
  sentiment_score?: number;
  sentiment_label?: string;
}

interface MyComment {
  id: string;
  reddit_post_id: string;
  reddit_parent_id?: string;
  entry_point_used?: string;
  generated_response: string;
  final_response?: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  reddit_comment_id?: string;
  submission_response?: string;
  post?: RedditPost;
  target_comment?: RedditComment;
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
  const [analyzedThreads, setAnalyzedThreads] = useState<RedditCommentThread[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [selectedComment, setSelectedComment] = useState<RedditComment | null>(null);
  const [selectedThread, setSelectedThread] = useState<RedditCommentThread | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [selectedEntryPoint, setSelectedEntryPoint] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [finalResponse, setFinalResponse] = useState('');
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyzedPosts();
    loadAnalyzedThreads();
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

  const loadAnalyzedThreads = async () => {
    try {
      // First get analyzed root comments
      const { data: comments, error: commentsError } = await supabase
        .from('reddit_comments')
        .select('*')
        .eq('depth', 0)
        .not('analyzed_at', 'is', null)
        .order('analyzed_at', { ascending: false })
        .limit(20);

      if (commentsError) throw commentsError;

      if (!comments || comments.length === 0) {
        setAnalyzedThreads([]);
        return;
      }

      // Get the corresponding posts
      const postIds = [...new Set(comments.map(c => c.reddit_post_id))];
      const { data: posts, error: postsError } = await supabase
        .from('reddit_posts')
        .select('*')
        .in('reddit_post_id', postIds);

      if (postsError) throw postsError;

      // Create thread objects by combining comments with their posts
      const threads = comments.map(rootComment => {
        const post = posts?.find(p => p.reddit_post_id === rootComment.reddit_post_id);
        
        if (!post) return null; // Skip if post not found
        
        // Generate thread-specific entry points combining post and comment analysis
        const threadEntryPoints = [
          ...(Array.isArray(post.entry_points) ? post.entry_points : []),
          'Respond to specific comment perspective',
          'Build on thread discussion',
          'Address thread sentiment patterns',
          'Connect thread themes to critical thinking'
        ];

        const thread: RedditCommentThread = {
          root_comment: {
            ...rootComment,
            keywords: Array.isArray(rootComment.keywords) ? rootComment.keywords : [],
            topics: Array.isArray(rootComment.topics) ? rootComment.topics : [],
            suggestion: {
              priority: 4,
              reason: 'Analyzed thread with engagement potential',
              approach: 'Thoughtful response to comment discussion',
              key_points: Array.isArray(rootComment.topics) ? rootComment.topics.map(String) : []
            }
          },
          thread_comments: [], // We'll load these when needed
          post: {
            ...post,
            keywords: Array.isArray(post.keywords) ? post.keywords : [],
            topics: Array.isArray(post.topics) ? post.topics : [],
            entry_points: threadEntryPoints
          },
          analyzed_at: rootComment.analyzed_at,
          ai_summary: rootComment.ai_summary,
          keywords: Array.isArray(rootComment.keywords) ? rootComment.keywords : [],
          topics: Array.isArray(rootComment.topics) ? rootComment.topics : [],
          sentiment_score: rootComment.sentiment_score,
          sentiment_label: rootComment.sentiment_label
        };
        return thread;
      }).filter(Boolean) as RedditCommentThread[]; // Remove null entries

      setAnalyzedThreads(threads);
    } catch (error) {
      console.error('Error loading analyzed threads:', error);
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

  const loadComments = async (post: RedditPost) => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('reddit_comments')
        .select('*')
        .eq('reddit_post_id', post.reddit_post_id)
        .order('created_utc', { ascending: true });

      if (error) throw error;

      // Filter out AutoModerator comments
      const processedComments = (commentsData || [])
        .filter(comment => comment.author !== 'AutoModerator')
        .map(comment => ({
          ...comment,
          keywords: Array.isArray(comment.keywords) ? comment.keywords : [],
          topics: Array.isArray(comment.topics) ? comment.topics : []
        }));

      setComments(processedComments);
      
      // Generate AI suggestions for best comments to respond to
      if (processedComments.length > 0) {
        generateCommentSuggestions(post, processedComments);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const generateCommentSuggestions = async (post: RedditPost, commentsList: RedditComment[]) => {
    try {
      // Get top comments (by score) that are analyzed and not AutoModerator
      const topComments = commentsList
        .filter(c => c.analyzed_at && c.score > 1 && c.author !== 'AutoModerator')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (topComments.length === 0) return;

      const prompt = `
        Based on this Reddit post and its top comments, suggest which comments would be best to respond to from a critical thinking perspective.
        
        Post: "${post.title}"
        Content: "${post.content || 'No content'}"
        Entry Points: ${post.entry_points?.join(', ') || 'None'}
        
        Comments:
        ${topComments.map((c, i) => `
        ${i + 1}. u/${c.author} (Score: ${c.score}): "${c.content}"
        ${c.ai_summary ? `Summary: ${c.ai_summary}` : ''}
        ${c.sentiment_label ? `Sentiment: ${c.sentiment_label}` : ''}
        `).join('\n')}
        
        For each comment, provide:
        1. Priority (1-5, where 5 is highest)
        2. Reason why this comment is a good opportunity for critical thinking engagement
        3. Suggested angle/approach
        4. Key points to address
        
        Return as JSON array with format:
        [{
          "comment_index": 1,
          "priority": 5,
          "reason": "...",
          "approach": "...",
          "key_points": ["...", "..."]
        }]
      `;

      const { data, error } = await supabase.functions.invoke('reddit-analyzer', {
        body: { 
          action: 'generate_comment_suggestions',
          data: { prompt }
        }
      });

      if (error) throw error;
      
      // Store suggestions with comments for UI display
      const suggestions = JSON.parse(data.suggestions || '[]');
      const commentsWithSuggestions = commentsList.map(comment => {
        const suggestion = suggestions.find((s: any) => 
          topComments[s.comment_index - 1]?.reddit_comment_id === comment.reddit_comment_id
        );
        return { ...comment, suggestion };
      });
      
      setComments(commentsWithSuggestions);
    } catch (error: any) {
      console.error('Error generating comment suggestions:', error);
    }
  };

  const loadThreadComments = async (thread: RedditCommentThread) => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('reddit_comments')
        .select('*')
        .eq('reddit_post_id', thread.post.reddit_post_id)
        .order('created_utc', { ascending: true });

      if (error) throw error;

      // Filter out AutoModerator comments and process
      const processedComments = (commentsData || [])
        .filter(comment => comment.author !== 'AutoModerator')
        .map(comment => ({
          ...comment,
          keywords: Array.isArray(comment.keywords) ? comment.keywords : [],
          topics: Array.isArray(comment.topics) ? comment.topics : [],
          suggestion: comment.analyzed_at ? {
            priority: comment.score > 5 ? 4 : 3,
            reason: 'Analyzed comment in selected thread',
            approach: 'Respond thoughtfully to build on thread discussion',
            key_points: Array.isArray(comment.topics) ? comment.topics.map(String) : []
          } : undefined
        }));

      setComments(processedComments);
    } catch (error: any) {
      console.error('Error loading thread comments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load thread comments",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const generateResponse = async (targetComment?: RedditComment) => {
    if ((!selectedPost && !selectedThread) || !selectedEntryPoint) {
      toast({
        title: "Missing Information",
        description: "Please select a post/thread and entry point",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const contextData = {
        postContent: selectedPost?.content || selectedThread?.post.content || '',
        postTitle: selectedPost?.title || selectedThread?.post.title || '',
        commentContent: targetComment?.content || '',
        threadSummary: selectedThread?.ai_summary || '',
        threadKeywords: selectedThread?.keywords || [],
        entryPoint: selectedEntryPoint,
        curriculumContext: CURRICULUM_CONTEXT
      };

      const { data, error } = await supabase.functions.invoke('reddit-analyzer', {
        body: { 
          action: 'generate_response',
          data: contextData
        }
      });

      if (error) throw error;

      setGeneratedResponse(data.response);
      setFinalResponse(data.response);
      
      toast({
        title: "Success",
        description: targetComment ? "Comment response generated" : 
                     selectedThread ? "Thread response generated" : 
                     "Post response generated",
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

  const saveComment = async (targetComment?: RedditComment) => {
    if ((!selectedPost && !selectedThread) || !finalResponse || !selectedEntryPoint) return;

    try {
      const postId = selectedPost?.reddit_post_id || selectedThread?.post.reddit_post_id;
      const parentId = targetComment ? `t1_${targetComment.reddit_comment_id}` : 
                       selectedThread ? `t1_${selectedThread.root_comment.reddit_comment_id}` :
                       `t3_${postId}`;

      const { error } = await supabase
        .from('reddit_my_comments')
        .insert({
          reddit_post_id: postId,
          reddit_parent_id: parentId,
          generated_response: generatedResponse,
          final_response: finalResponse,
          entry_point_used: selectedEntryPoint,
          status: 'draft',
        });

      if (error) throw error;

      loadMyComments();
      
      // Clear the form
      setSelectedPost(null);
      setSelectedThread(null);
      setSelectedComment(null);
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
            thingId: comment.reddit_parent_id || `t3_${comment.reddit_post_id}`,
            text: comment.final_response || comment.generated_response
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

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'bg-green-100 text-green-800';
    if (score < -0.1) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
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
                        setSelectedComment(null);
                        setSelectedThread(null);
                        setSelectedEntryPoint('');
                        setGeneratedResponse('');
                        setFinalResponse('');
                        setComments([]);
                        loadComments(post);
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

            {/* Analyzed Comment Threads */}
            {analyzedThreads.length > 0 && (
              <div className="space-y-2">
                <Label>Analyzed Comment Threads</Label>
                <ScrollArea className="h-[200px] border rounded p-2">
                  <div className="space-y-2">
                    {analyzedThreads.map((thread) => (
                      <div
                        key={thread.root_comment.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedThread?.root_comment.id === thread.root_comment.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => {
                         setSelectedThread(thread);
                           setSelectedPost(null);
                           setSelectedComment(null);
                           setSelectedEntryPoint('');
                           setGeneratedResponse('');
                           setFinalResponse('');
                           setComments([]);
                           loadThreadComments(thread);
                        }}
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium line-clamp-2">
                            Thread: {thread.post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            u/{thread.root_comment.author}: {thread.root_comment.content}
                          </p>
                           <div className="flex items-center gap-2 mt-1">
                             <Badge variant="secondary" className="text-xs">r/{thread.post.subreddit_name}</Badge>
                             <Badge variant="outline" className="text-xs">
                               <Bot className="h-3 w-3 mr-1" />
                               Thread Analyzed
                             </Badge>
                             <span className="text-xs text-muted-foreground">
                               {thread.post.entry_points?.length || 0} entry points
                             </span>
                             {thread.sentiment_label && (
                               <Badge className={`text-xs ${getSentimentColor(thread.sentiment_score || 0)}`}>
                                 {thread.sentiment_label}
                               </Badge>
                             )}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Comments with AI Suggestions */}
            {(selectedPost || selectedThread) && comments.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {selectedThread ? 'Thread Comments to Respond To' : 'AI-Suggested Comments to Respond To'}
                </Label>
                <ScrollArea className="h-[300px] border rounded p-2">
                  <div className="space-y-2">
                    {comments
                      .filter(c => selectedThread ? true : (c.suggestion && c.suggestion.priority >= 3))
                      .sort((a, b) => (b.suggestion?.priority || 0) - (a.suggestion?.priority || 0))
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            selectedComment?.id === comment.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => {
                            setSelectedComment(comment);
                            setGeneratedResponse('');
                            setFinalResponse('');
                          }}
                        >
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 {comment.suggestion && (
                                   <Badge variant="secondary" className="text-xs">
                                     Priority: {comment.suggestion?.priority}/5
                                   </Badge>
                                 )}
                                 <span className="text-xs text-muted-foreground">u/{comment.author}</span>
                                 <span className="flex items-center gap-1 text-xs">
                                   <ThumbsUp className="h-3 w-3" />
                                   {comment.score}
                                 </span>
                                 {comment.analyzed_at && (
                                   <Badge variant="outline" className="text-xs">
                                     <Bot className="h-3 w-3 mr-1" />
                                     Analyzed
                                   </Badge>
                                 )}
                                 {comment.depth > 0 && (
                                   <Badge variant="outline" className="text-xs">
                                     Depth: {comment.depth}
                                   </Badge>
                                 )}
                               </div>
                             </div>
                             
                             <p className="text-sm line-clamp-2">{comment.content}</p>
                             
                             {comment.suggestion && (
                               <div className="text-xs bg-muted p-2 rounded">
                                 <p className="font-medium">AI Suggestion:</p>
                                 <p className="text-muted-foreground">{comment.suggestion.reason}</p>
                                 <p className="mt-1"><strong>Approach:</strong> {comment.suggestion.approach}</p>
                               </div>
                             )}

                             {selectedThread && comment.analyzed_at && (
                               <div className="text-xs bg-accent p-2 rounded">
                                 <p className="font-medium">Thread Comment Analysis:</p>
                                 {comment.sentiment_label && (
                                   <p><strong>Sentiment:</strong> {comment.sentiment_label}</p>
                                 )}
                                 {comment.topics && comment.topics.length > 0 && (
                                   <p><strong>Topics:</strong> {comment.topics.join(', ')}</p>
                                 )}
                               </div>
                             )}
                           </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Entry Point Selection */}
            {(selectedPost || selectedThread) && (
              <div className="space-y-2">
                <Label>Choose Entry Point</Label>
                <Select value={selectedEntryPoint} onValueChange={setSelectedEntryPoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a critical thinking angle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedPost?.entry_points || selectedThread?.post.entry_points || []).map((point, idx) => (
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
              onClick={() => generateResponse(selectedComment || undefined)}
              disabled={(!selectedPost && !selectedThread) || !selectedEntryPoint || generating}
              className="w-full"
            >
              <Bot className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 
                selectedComment ? 'Generate Comment Response' :
                selectedThread ? 'Generate Thread Response' : 
                'Generate Post Response'}
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
                  <Button onClick={() => saveComment(selectedComment || undefined)} disabled={!finalResponse}>
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
                  const post = analyzedPosts.find(p => p.reddit_post_id === comment.reddit_post_id);
                  const isCommentReply = comment.reddit_parent_id?.startsWith('t1_');
                  
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
                            {isCommentReply && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                Reply to Comment
                              </Badge>
                            )}
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
                          value={comment.final_response || comment.generated_response}
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