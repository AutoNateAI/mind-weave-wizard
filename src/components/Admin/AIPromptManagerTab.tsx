import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Edit, 
  Plus, 
  Save, 
  History, 
  Copy,
  Eye,
  Trash2,
  Search,
  Filter,
  Code,
  Settings,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AIPrompt {
  id: string;
  prompt_name: string;
  prompt_category: string;
  prompt_template: string;
  prompt_description: string | null;
  feature_page: string | null;
  variables: any[];
  is_active: boolean;
  version: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

interface PromptVariable {
  id: string;
  variable_name: string;
  variable_type: string;
  default_value: string | null;
  possible_values: any[];
  description: string | null;
  is_global: boolean;
}

const PROMPT_CATEGORIES = [
  'course_generation',
  'content_creation', 
  'social_media',
  'game_creation',
  'lecture_generation',
  'assessment',
  'system'
];

const VARIABLE_TYPES = [
  'text',
  'number', 
  'select',
  'array',
  'location',
  'user_input'
];

export function AIPromptManagerTab() {
  const [activeTab, setActiveTab] = useState('prompts');
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');

  const [editForm, setEditForm] = useState({
    prompt_name: '',
    prompt_category: '',
    prompt_template: '',
    prompt_description: '',
    feature_page: '',
    variables: [] as any[],
    is_active: true
  });

  useEffect(() => {
    loadPrompts();
    loadVariables();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('prompt_category', { ascending: true })
        .order('prompt_name', { ascending: true });

      if (error) throw error;
      setPrompts((data || []).map(prompt => ({
        ...prompt,
        variables: Array.isArray(prompt.variables) ? prompt.variables : []
      })));
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Error loading prompts",
        description: "Failed to load AI prompts from database",
        variant: "destructive"
      });
    }
  };

  const loadVariables = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_variables')
        .select('*')
        .order('variable_name', { ascending: true });

      if (error) throw error;
      setVariables((data || []).map(variable => ({
        ...variable,
        possible_values: Array.isArray(variable.possible_values) ? variable.possible_values : []
      })));
    } catch (error) {
      console.error('Error loading variables:', error);
      toast({
        title: "Error loading variables",
        description: "Failed to load prompt variables",
        variant: "destructive"
      });
    }
  };

  const savePrompt = async () => {
    try {
      if (!editForm.prompt_name || !editForm.prompt_template) {
        toast({
          title: "Validation error",
          description: "Prompt name and template are required",
          variant: "destructive"
        });
        return;
      }

      const promptData = {
        ...editForm,
        updated_at: new Date().toISOString()
      };

      if (selectedPrompt) {
        // Save to history first
        await supabase
          .from('prompt_history')
          .insert([{
            prompt_id: selectedPrompt.id,
            old_template: selectedPrompt.prompt_template,
            old_variables: selectedPrompt.variables,
            changed_by: (await supabase.auth.getUser()).data.user?.id,
            change_reason: 'Manual edit via prompt manager'
          }]);

        // Update existing prompt
        const { error } = await supabase
          .from('ai_prompts')
          .update({
            ...promptData,
            version: selectedPrompt.version + 1
          })
          .eq('id', selectedPrompt.id);

        if (error) throw error;
        toast({
          title: "Prompt updated",
          description: `"${editForm.prompt_name}" has been updated successfully`,
        });
      } else {
        // Create new prompt
        const { error } = await supabase
          .from('ai_prompts')
          .insert([{
            ...promptData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (error) throw error;
        toast({
          title: "Prompt created",
          description: `"${editForm.prompt_name}" has been created successfully`,
        });
      }

      setIsEditing(false);
      setSelectedPrompt(null);
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error saving prompt",
        description: "Failed to save the prompt",
        variant: "destructive"
      });
    }
  };

  const deletePrompt = async (promptId: string) => {
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;
      
      toast({
        title: "Prompt deleted",
        description: "The prompt has been deleted successfully",
      });
      
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
      }
      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: "Error deleting prompt",
        description: "Failed to delete the prompt",
        variant: "destructive"
      });
    }
  };

  const duplicatePrompt = async (prompt: AIPrompt) => {
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .insert([{
          prompt_name: `${prompt.prompt_name}_copy`,
          prompt_category: prompt.prompt_category,
          prompt_template: prompt.prompt_template,
          prompt_description: `Copy of ${prompt.prompt_description || prompt.prompt_name}`,
          feature_page: prompt.feature_page,
          variables: prompt.variables,
          is_active: false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      
      toast({
        title: "Prompt duplicated",
        description: "A copy of the prompt has been created",
      });
      
      loadPrompts();
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      toast({
        title: "Error duplicating prompt",
        description: "Failed to duplicate the prompt",
        variant: "destructive"
      });
    }
  };

  const startEdit = (prompt?: AIPrompt) => {
    if (prompt) {
      setSelectedPrompt(prompt);
      setEditForm({
        prompt_name: prompt.prompt_name,
        prompt_category: prompt.prompt_category,
        prompt_template: prompt.prompt_template,
        prompt_description: prompt.prompt_description || '',
        feature_page: prompt.feature_page || '',
        variables: prompt.variables || [],
        is_active: prompt.is_active
      });
    } else {
      setSelectedPrompt(null);
      setEditForm({
        prompt_name: '',
        prompt_category: 'content_creation',
        prompt_template: '',
        prompt_description: '',
        feature_page: '',
        variables: [],
        is_active: true
      });
    }
    setIsEditing(true);
  };

  const previewPromptWithVariables = () => {
    let preview = editForm.prompt_template;
    const variables = editForm.variables || [];
    
    // Replace variables with sample values
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      const sampleValue = variable.type === 'select' && variable.values?.length > 0 
        ? variable.values[0]
        : variable.default || `[${variable.name}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleValue);
    });
    
    setPreviewPrompt(preview);
    setShowPreview(true);
  };

  const addVariable = () => {
    setEditForm(prev => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          name: '',
          type: 'text',
          required: false,
          default: '',
          values: [],
          description: ''
        }
      ]
    }));
  };

  const updateVariable = (index: number, field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.prompt_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.prompt_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.feature_page?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || prompt.prompt_category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Prompt Library Manager</h2>
          <p className="text-muted-foreground">
            Centralized management of all AI prompts with variables and version control.
          </p>
        </div>
        <Button onClick={() => startEdit()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {PROMPT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prompts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  AI Prompts
                  <Badge variant="secondary">{filteredPrompts.length} prompts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPrompts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No prompts found. Create your first prompt to get started.
                    </p>
                  ) : (
                    filteredPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPrompt?.id === prompt.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{prompt.prompt_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {prompt.prompt_category.replace('_', ' ')}
                              </Badge>
                              {!prompt.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {prompt.prompt_description || 'No description'}
                            </p>
                            {prompt.feature_page && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Used in: {prompt.feature_page}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>v{prompt.version}</span>
                              <span>Used {prompt.usage_count} times</span>
                              <span>{formatDate(prompt.updated_at)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(prompt);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicatePrompt(prompt);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePrompt(prompt.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prompt Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Prompt Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPrompt ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">{selectedPrompt.prompt_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPrompt.prompt_description}
                      </p>
                    </div>

                    {selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
                      <div>
                        <Label>Variables</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPrompt.variables.map((variable: any, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable.name} ({variable.type})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Prompt Template</Label>
                      <div className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {selectedPrompt.prompt_template}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => startEdit(selectedPrompt)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Prompt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicatePrompt(selectedPrompt)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a prompt to view details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                      {variables.filter(v => v.is_global).map((variable) => (
                  <div key={variable.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{`{{${variable.variable_name}}}`}</h4>
                        <p className="text-sm text-muted-foreground">{variable.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {variable.variable_type}
                          </Badge>
                          {variable.default_value && (
                            <Badge variant="secondary" className="text-xs">
                              Default: {variable.default_value}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prompts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {prompts.filter(p => p.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...prompts.map(p => p.usage_count), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {prompts.find(p => p.usage_count === Math.max(...prompts.map(p => p.usage_count)))?.prompt_name || 'None'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(prompts.map(p => p.prompt_category)).size}
                </div>
                <p className="text-xs text-muted-foreground">Unique categories</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Prompt Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt_name">Prompt Name *</Label>
                <Input
                  id="prompt_name"
                  value={editForm.prompt_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, prompt_name: e.target.value }))}
                  placeholder="e.g., social_content_generation"
                />
              </div>

              <div>
                <Label htmlFor="prompt_category">Category *</Label>
                <Select
                  value={editForm.prompt_category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, prompt_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feature_page">Feature/Page</Label>
                <Input
                  id="feature_page"
                  value={editForm.feature_page}
                  onChange={(e) => setEditForm(prev => ({ ...prev, feature_page: e.target.value }))}
                  placeholder="e.g., content_creation_tab"
                />
              </div>

              <div>
                <Label htmlFor="prompt_description">Description</Label>
                <Textarea
                  id="prompt_description"
                  value={editForm.prompt_description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, prompt_description: e.target.value }))}
                  placeholder="Brief description of what this prompt does"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="prompt_template">Prompt Template *</Label>
                <Textarea
                  id="prompt_template"
                  value={editForm.prompt_template}
                  onChange={(e) => setEditForm(prev => ({ ...prev, prompt_template: e.target.value }))}
                  placeholder="Your prompt template with {{variables}} in double curly braces"
                  rows={8}
                  className="font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Variables</Label>
                <Button size="sm" onClick={addVariable} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Variable
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {editForm.variables.map((variable, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Variable name"
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVariable(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={variable.type}
                        onValueChange={(value) => updateVariable(index, 'type', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Default value"
                        value={variable.default || ''}
                        onChange={(e) => updateVariable(index, 'default', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <Input
                      placeholder="Description"
                      value={variable.description || ''}
                      onChange={(e) => updateVariable(index, 'description', e.target.value)}
                      className="text-sm"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={variable.required || false}
                        onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                      />
                      <Label htmlFor={`required-${index}`} className="text-sm">Required</Label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={previewPromptWithVariables} variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button onClick={savePrompt} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save Prompt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prompt Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
              {previewPrompt}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}