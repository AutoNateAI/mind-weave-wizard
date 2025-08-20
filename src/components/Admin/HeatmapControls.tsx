import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, RefreshCw, X } from 'lucide-react';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import { useToast } from '@/components/ui/use-toast';

interface HeatmapControlsProps {
  activeLayer: string;
  onLayerChange: (layer: string) => void;
  compact?: boolean;
}

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  activeLayer,
  onLayerChange,
  compact = false
}) => {
  const { 
    loading, 
    filters, 
    setFilters, 
    triggerAnalysis, 
    getTopKeywords,
    refreshData
  } = useHeatmapData();
  const { toast } = useToast();
  const [selectedKeyword, setSelectedKeyword] = React.useState('');
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  
  const topKeywords = getTopKeywords();

  const handleAnalysis = async (action: 'process_profiles' | 'process_posts' | 'generate_heatmap' | 'full_analysis') => {
    if (loadingAction) return;
    
    setLoadingAction(action);
    try {
      const result = await triggerAnalysis(action);
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: `${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} completed successfully`,
        });
        // Refresh data after successful analysis
        await refreshData();
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const addKeywordFilter = () => {
    if (selectedKeyword && !filters.keywords.includes(selectedKeyword)) {
      setFilters({
        ...filters,
        keywords: [...filters.keywords, selectedKeyword]
      });
      setSelectedKeyword('');
    }
  };

  const removeKeywordFilter = (keyword: string) => {
    setFilters({
      ...filters,
      keywords: filters.keywords.filter(k => k !== keyword)
    });
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-6 p-4 bg-card rounded-lg border"}>
      {!compact && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Heat Map Controls</h3>
        </div>
      )}
      <div>
        
        {/* Layer Selection */}
        <div className="space-y-2 mb-4">
          <Label>Active Layer</Label>
          <Select value={activeLayer} onValueChange={onLayerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select heat map layer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="density">Keyword Density</SelectItem>
              <SelectItem value="engagement">Engagement Heat</SelectItem>
              <SelectItem value="sentiment">Sentiment Intensity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Analysis Triggers */}
        <div className="space-y-2 mb-4">
          <Label>Data Processing</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAnalysis('process_profiles')}
              disabled={loadingAction !== null}
            >
              {loadingAction === 'process_profiles' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Profiles
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAnalysis('process_posts')}
              disabled={loadingAction !== null}
            >
              {loadingAction === 'process_posts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Posts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAnalysis('generate_heatmap')}
              disabled={loadingAction !== null}
            >
              {loadingAction === 'generate_heatmap' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Generate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAnalysis('full_analysis')}
              disabled={loadingAction !== null}
            >
              {loadingAction === 'full_analysis' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Full Analysis
            </Button>
          </div>
        </div>

        {/* Keyword Filters */}
        <div className="space-y-2 mb-4">
          <Label>Keyword Filters</Label>
          <div className="flex gap-2">
            <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select keyword..." />
              </SelectTrigger>
              <SelectContent>
                {topKeywords.map(keyword => (
                  <SelectItem key={keyword} value={keyword}>
                    {keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addKeywordFilter}
              disabled={!selectedKeyword}
            >
              Add
            </Button>
          </div>
          
          {filters.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.keywords.map(keyword => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => removeKeywordFilter(keyword)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="space-y-2 mb-4">
          <Label>Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        {/* Sentiment Range */}
        <div className="space-y-2 mb-4">
          <Label>Sentiment Range: {filters.sentimentRange.min.toFixed(1)} to {filters.sentimentRange.max.toFixed(1)}</Label>
          <Slider
            value={[filters.sentimentRange.min, filters.sentimentRange.max]}
            onValueChange={([min, max]) => setFilters({
              ...filters,
              sentimentRange: { min, max }
            })}
            min={-1}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Engagement Threshold */}
        <div className="space-y-2 mb-4">
          <Label>Min Engagement: {filters.engagementThreshold}</Label>
          <Slider
            value={[filters.engagementThreshold]}
            onValueChange={([value]) => setFilters({
              ...filters,
              engagementThreshold: value
            })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={refreshData}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Data
        </Button>
      </div>
    </div>
  );
};