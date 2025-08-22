import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Users, Eye, EyeOff, RotateCcw, Edit } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Subreddit {
  id: string;
  subreddit_name: string;
  display_name: string;
  description: string;
  subscribers: number;
  is_active: boolean;
  tracking_keywords: any[];
  last_scraped_at: string;
  created_at: string;
}

interface SubredditManagerProps {
  isConnected: boolean;
}

export function SubredditManager({ isConnected }: SubredditManagerProps) {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [keywords, setKeywords] = useState('');
  const [editingSubreddit, setEditingSubreddit] = useState<Subreddit | null>(null);
  const [editKeywords, setEditKeywords] = useState('');
  const [sortOptions, setSortOptions] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSubreddits();
  }, []);

  const loadSubreddits = async () => {
    try {
      const { data, error } = await supabase
        .from('reddit_subreddits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubreddits((data || []).map(sub => ({
        ...sub,
        tracking_keywords: Array.isArray(sub.tracking_keywords) ? sub.tracking_keywords : []
      })));
    } catch (error) {
      console.error('Error loading subreddits:', error);
      toast({
        title: "Error",
        description: "Failed to load subreddits",
        variant: "destructive",
      });
    }
  };

  const addSubreddit = async () => {
    if (!newSubreddit.trim()) return;

    setLoading(true);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const { error } = await supabase
        .from('reddit_subreddits')
        .insert({
          subreddit_name: newSubreddit.trim(),
          display_name: newSubreddit.trim(),
          tracking_keywords: keywordArray,
          is_active: true,
        });

      if (error) throw error;

      setNewSubreddit('');
      setKeywords('');
      loadSubreddits();
      
      toast({
        title: "Success",
        description: `Added r/${newSubreddit} to tracking list`,
      });
    } catch (error: any) {
      console.error('Error adding subreddit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add subreddit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubreddit = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reddit_subreddits')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadSubreddits();
      
      toast({
        title: "Success",
        description: `Subreddit ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling subreddit:', error);
      toast({
        title: "Error",
        description: "Failed to update subreddit",
        variant: "destructive",
      });
    }
  };

  const removeSubreddit = async (id: string, name: string) => {
    if (!confirm(`Remove r/${name} from tracking?`)) return;

    try {
      const { error } = await supabase
        .from('reddit_subreddits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSubreddits();
      
      toast({
        title: "Success",
        description: `Removed r/${name} from tracking`,
      });
    } catch (error) {
      console.error('Error removing subreddit:', error);
      toast({
        title: "Error",
        description: "Failed to remove subreddit",
        variant: "destructive",
      });
    }
  };

  const updateSubreddit = async (id: string, newKeywords: string[]) => {
    try {
      const { error } = await supabase
        .from('reddit_subreddits')
        .update({ tracking_keywords: newKeywords })
        .eq('id', id);

      if (error) throw error;

      loadSubreddits();
      setEditingSubreddit(null);
      setEditKeywords('');
      
      toast({
        title: "Success",
        description: "Subreddit keywords updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating subreddit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subreddit",
        variant: "destructive",
      });
    }
  };

  const fetchPosts = async (subreddit: Subreddit) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Reddit API connection required",
        variant: "destructive",
      });
      return;
    }

    const sortType = sortOptions[subreddit.id] || 'hot';
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reddit-api', {
        body: { 
          action: 'fetch_subreddit_posts',
          data: { 
            subreddit: subreddit.subreddit_name, 
            limit: 25,
            sort: sortType
          }
        }
      });

      if (error) throw error;

      // Update last_scraped_at
      await supabase
        .from('reddit_subreddits')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', subreddit.id);

      loadSubreddits();
      
      toast({
        title: "Success",
        description: `Fetched ${data.posts?.length || 0} ${sortType} posts from r/${subreddit.subreddit_name}. Check the Analyzer tab to review them.`,
      });
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Subreddit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Subreddit to Track
          </CardTitle>
          <CardDescription>
            Add subreddits to monitor for engagement opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subreddit">Subreddit Name</Label>
              <Input
                id="subreddit"
                placeholder="e.g., philosophy"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubreddit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Tracking Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                placeholder="e.g., critical thinking, logic, reasoning"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addSubreddit} disabled={loading || !newSubreddit.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subreddit
          </Button>
        </CardContent>
      </Card>

      {/* Tracked Subreddits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Tracked Subreddits ({subreddits.length})
            </span>
            <Button variant="outline" size="sm" onClick={loadSubreddits}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your tracked subreddits and fetch new posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subreddits.length === 0 ? (
            <Alert>
              <AlertDescription>
                No subreddits tracked yet. Add some subreddits above to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {subreddits.map((subreddit) => (
                <div
                  key={subreddit.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold">r/{subreddit.subreddit_name}</h4>
                      <Badge variant={subreddit.is_active ? "default" : "secondary"}>
                        {subreddit.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {subreddit.tracking_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {subreddit.tracking_keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {subreddit.last_scraped_at && (
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(subreddit.last_scraped_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:flex-shrink-0">
                    <Select
                      value={sortOptions[subreddit.id] || 'hot'}
                      onValueChange={(value) => setSortOptions(prev => ({ ...prev, [subreddit.id]: value }))}
                    >
                      <SelectTrigger className="w-full sm:w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="rising">Rising</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPosts(subreddit)}
                      disabled={loading || !isConnected}
                      className="w-full sm:w-auto"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Fetch Posts
                    </Button>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSubreddit(subreddit);
                              setEditKeywords(subreddit.tracking_keywords.join(', '));
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border shadow-lg">
                          <DialogHeader>
                            <DialogTitle>Edit r/{subreddit.subreddit_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-keywords">Tracking Keywords (comma-separated)</Label>
                              <Input
                                id="edit-keywords"
                                placeholder="e.g., critical thinking, logic, reasoning"
                                value={editKeywords}
                                onChange={(e) => setEditKeywords(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingSubreddit(null);
                                  setEditKeywords('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  const keywordArray = editKeywords.split(',').map(k => k.trim()).filter(k => k);
                                  updateSubreddit(subreddit.id, keywordArray);
                                }}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSubreddit(subreddit.id, subreddit.is_active)}
                      >
                        {subreddit.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubreddit(subreddit.id, subreddit.subreddit_name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}