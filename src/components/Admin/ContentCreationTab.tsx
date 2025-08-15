import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Target, 
  Calendar, 
  BarChart3, 
  FileText,
  MapPin,
  Users,
  Brain,
  Send,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TargetedLocation {
  id: string;
  company_name: string;
  office_address: string;
  city: string | null;
  state: string | null;
}

interface ContentCampaign {
  id: string;
  campaign_name: string;
  target_location_id: string | null;
  content_type: string;
  generated_content: string | null;
  content_prompt: string | null;
  critical_thinking_concepts: string[];
  content_status: string;
  scheduled_publish_at: string | null;
  published_at: string | null;
  created_at: string;
  targeted_locations?: TargetedLocation;
}

const CRITICAL_THINKING_CONCEPTS = [
  'Systems Thinking',
  'Pattern Recognition',
  'Mental Models',
  'First Principles',
  'Perspective Taking',
  'Logical Reasoning',
  'Evidence Evaluation',
  'Bias Recognition',
  'Decision Trees',
  'Cause and Effect Analysis'
];

const CONTENT_TYPES = [
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'linkedin_article', label: 'LinkedIn Article' },
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'instagram_story', label: 'Instagram Story' }
];

export function ContentCreationTab() {
  const [activeTab, setActiveTab] = useState('create');
  const [locations, setLocations] = useState<TargetedLocation[]>([]);
  const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ContentCampaign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    campaign_name: '',
    target_location_id: '',
    content_type: 'linkedin_post',
    content_prompt: '',
    selected_concepts: [] as string[],
    custom_instructions: ''
  });

  useEffect(() => {
    loadLocations();
    loadCampaigns();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('targeted_locations')
        .select('id, company_name, office_address, city, state')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('content_campaigns')
        .select(`
          *,
          targeted_locations:target_location_id (
            id,
            company_name,
            office_address,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []).map(campaign => ({
        ...campaign,
        critical_thinking_concepts: Array.isArray(campaign.critical_thinking_concepts) 
          ? campaign.critical_thinking_concepts.map(c => String(c))
          : []
      })));
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const generateContent = async () => {
    if (!formData.campaign_name || !formData.content_type) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsGenerating(true);
    try {
      // Get location and social data for context
      const locationData = locations.find(l => l.id === formData.target_location_id);
      
      // Build the AI prompt
      const basePrompt = formData.content_prompt || 
        `Create engaging ${formData.content_type.replace('_', ' ')} content for professionals`;
      
      const contextPrompt = `
        ${basePrompt}
        
        ${locationData ? `Target Location: ${locationData.company_name} in ${locationData.city}, ${locationData.state}` : ''}
        
        Critical Thinking Focus: ${formData.selected_concepts.join(', ')}
        
        The content should:
        - Connect with local professionals and businesses
        - Incorporate the specified critical thinking concepts naturally
        - Be engaging and thought-provoking
        - Encourage interaction and discussion
        - Relate to our thinking skills course offerings
        
        ${formData.custom_instructions ? `Additional Instructions: ${formData.custom_instructions}` : ''}
      `;

      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          prompt: contextPrompt,
          content_type: formData.content_type,
          location_context: locationData,
          critical_thinking_concepts: formData.selected_concepts
        }
      });

      if (error) throw error;

      // Save the campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('content_campaigns')
        .insert([{
          campaign_name: formData.campaign_name,
          target_location_id: formData.target_location_id || null,
          content_type: formData.content_type,
          generated_content: data.content,
          content_prompt: contextPrompt,
          critical_thinking_concepts: formData.selected_concepts,
          content_status: 'draft',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (campaignError) throw campaignError;

      toast.success('Content generated successfully!');
      setFormData({
        campaign_name: '',
        target_location_id: '',
        content_type: 'linkedin_post',
        content_prompt: '',
        selected_concepts: [],
        custom_instructions: ''
      });
      loadCampaigns();
      setActiveTab('campaigns');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('content_campaigns')
        .update({ content_status: status })
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success(`Campaign marked as ${status}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('content_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success('Campaign deleted successfully');
      loadCampaigns();
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const toggleConcept = (concept: string) => {
    setFormData(prev => ({
      ...prev,
      selected_concepts: prev.selected_concepts.includes(concept)
        ? prev.selected_concepts.filter(c => c !== concept)
        : [...prev.selected_concepts, concept]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'scheduled': return 'secondary';
      case 'reviewed': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Content Creation</h2>
        <p className="text-muted-foreground">
          Generate location-targeted social media content that incorporates critical thinking concepts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Content</TabsTrigger>
          <TabsTrigger value="campaigns">Manage Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate New Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign_name">Campaign Name *</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="e.g., SF Tech Professionals - Critical Thinking"
                  />
                </div>

                <div>
                  <Label htmlFor="target_location">Target Location</Label>
                  <Select 
                    value={formData.target_location_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.company_name} - {location.city}, {location.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content_type">Content Type *</Label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Critical Thinking Concepts</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CRITICAL_THINKING_CONCEPTS.map(concept => (
                      <Button
                        key={concept}
                        variant={formData.selected_concepts.includes(concept) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleConcept(concept)}
                        className="justify-start text-xs"
                      >
                        <Brain className="h-3 w-3 mr-1" />
                        {concept}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="content_prompt">Content Prompt</Label>
                  <Textarea
                    id="content_prompt"
                    value={formData.content_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_prompt: e.target.value }))}
                    placeholder="Describe the type of content you want to create..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="custom_instructions">Additional Instructions</Label>
                  <Textarea
                    id="custom_instructions"
                    value={formData.custom_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_instructions: e.target.value }))}
                    placeholder="Any specific tone, style, or requirements..."
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={generateContent}
                  disabled={isGenerating || !formData.campaign_name}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview/Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Content Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Content Goals</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Engage local professionals with critical thinking concepts</li>
                    <li>• Build awareness of our thinking skills course</li>
                    <li>• Establish thought leadership in target markets</li>
                    <li>• Generate meaningful discussions and interactions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Content Best Practices</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Include relevant local business context</li>
                    <li>• Make critical thinking concepts relatable</li>
                    <li>• Use storytelling to illustrate points</li>
                    <li>• Include a clear call-to-action</li>
                    <li>• Optimize for platform-specific audiences</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Generated content will be tracked for engagement, reach, and conversion metrics to help optimize future campaigns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaigns List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Content Campaigns
                  <Badge variant="secondary">{campaigns.length} campaigns</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No campaigns created yet. Generate your first content to get started.
                    </p>
                  ) : (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCampaign?.id === campaign.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            <p className="text-sm text-muted-foreground">{campaign.content_type.replace('_', ' ')}</p>
                            {campaign.targeted_locations && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {campaign.targeted_locations.company_name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={getStatusColor(campaign.content_status)} className="text-xs">
                                {campaign.content_status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(campaign.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCampaign(campaign.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Campaign Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCampaign ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">{selectedCampaign.campaign_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCampaign.content_type.replace('_', ' ')}
                      </p>
                    </div>

                    {selectedCampaign.critical_thinking_concepts.length > 0 && (
                      <div>
                        <Label>Critical Thinking Concepts</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedCampaign.critical_thinking_concepts.map((concept, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCampaign.generated_content && (
                      <div>
                        <Label>Generated Content</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                          {selectedCampaign.generated_content}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(selectedCampaign.id, 'reviewed')}
                        disabled={selectedCampaign.content_status === 'reviewed'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCampaignStatus(selectedCampaign.id, 'published')}
                        disabled={selectedCampaign.content_status === 'published'}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Mark Published
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a campaign to view details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">Content campaigns created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.filter(c => c.content_status === 'published').length}
                </div>
                <p className="text-xs text-muted-foreground">Published campaigns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locations Targeted</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(campaigns.filter(c => c.target_location_id).map(c => c.target_location_id)).size}
                </div>
                <p className="text-xs text-muted-foreground">Unique locations targeted</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed performance analytics will appear here once content is published and engagement data is collected.
                Metrics will include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Engagement rates by location</li>
                <li>Critical thinking concept resonance</li>
                <li>Lead generation effectiveness</li>
                <li>Content type performance comparison</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}