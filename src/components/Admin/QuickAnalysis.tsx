import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, RefreshCw, Zap, Target, Users, MessageSquare, TrendingUp } from 'lucide-react';

export const QuickAnalysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [progress, setProgress] = useState(0);

  const runQuickAnalysis = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      // Step 1: Process profiles
      setAnalysisStep('Analyzing LinkedIn profiles...');
      setProgress(25);
      
      const profileResult = await supabase.functions.invoke('ai-keyword-analyzer', {
        body: { action: 'process_profiles', batch_size: 15 }
      });
      
      if (profileResult.error) {
        throw new Error('Failed to process profiles');
      }
      
      // Step 2: Process posts
      setAnalysisStep('Analyzing LinkedIn posts...');
      setProgress(50);
      
      const postResult = await supabase.functions.invoke('ai-keyword-analyzer', {
        body: { action: 'process_posts', batch_size: 10 }
      });
      
      if (postResult.error) {
        throw new Error('Failed to process posts');
      }
      
      // Step 3: Generate heatmap data
      setAnalysisStep('Generating attention heat maps...');
      setProgress(75);
      
      const heatmapResult = await supabase.functions.invoke('ai-keyword-analyzer', {
        body: { action: 'generate_heatmap' }
      });
      
      if (heatmapResult.error) {
        throw new Error('Failed to generate heatmap data');
      }
      
      setAnalysisStep('Analysis complete!');
      setProgress(100);
      
      toast.success('Quick analysis completed! Check the Heat Map Controls and Analytics tabs for insights.');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisStep('');
        setProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsAnalyzing(false);
      setAnalysisStep('');
      setProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Run AI analysis on your LinkedIn data to generate attention heat maps and insights.
        </div>
        
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="text-sm font-medium">{analysisStep}</div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            Profile Analysis
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            Post Analysis
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="h-3 w-3" />
            Keyword Extraction
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Heat Map Generation
          </div>
        </div>
        
        <Button 
          onClick={runQuickAnalysis}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Quick Analysis
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          This will analyze your existing LinkedIn data and create attention heat maps for strategic insights.
        </div>
      </CardContent>
    </Card>
  );
};