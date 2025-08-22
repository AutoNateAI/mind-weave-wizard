import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, MessageSquare, BarChart3, Eye, Bot, Send, Edit3, TrendingUp } from 'lucide-react';
import { SubredditManager } from './Reddit/SubredditManager';
import { PostAnalyzer } from './Reddit/PostAnalyzer';
import { ResponseGenerator } from './Reddit/ResponseGenerator';
import { ActiveEngagements } from './Reddit/ActiveEngagements';
import { RedditAnalytics } from './Reddit/RedditAnalytics';

interface RedditTabProps {
  className?: string;
}

export function RedditTab({ className }: RedditTabProps) {
  const [activeTab, setActiveTab] = useState('subreddits');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkRedditConnection();
  }, []);

  const checkRedditConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reddit-api', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;
      setIsConnected(data.success);
    } catch (error) {
      console.error('Reddit connection check failed:', error);
      setIsConnected(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reddit Marketing</h2>
            <p className="text-muted-foreground">
              Engage with Reddit communities through critical thinking and meaningful conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={checkRedditConnection}
              disabled={loading}
            >
              Test Connection
            </Button>
          </div>
        </div>

        {/* Connection Alert */}
        {!isConnected && (
          <Alert>
            <AlertDescription>
              Reddit API not configured. You'll need to set up Reddit API credentials in Supabase Edge Function secrets:
              REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="subreddits" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Subreddits</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Responses</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subreddits" className="space-y-4">
            <SubredditManager isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-4">
            <PostAnalyzer isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <ResponseGenerator isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ActiveEngagements isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <RedditAnalytics isConnected={isConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}