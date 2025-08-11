import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FlowCanvas } from "@/components/GraphEditor/FlowCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Save, Play, MessageSquare, Brain, Lightbulb } from "lucide-react";

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: any;
  mechanics: any;
  content_slots: any;
}

interface LectureGame {
  id?: string;
  session_number: number;
  lecture_number: number;
  title: string;
  description: string;
  instructions: string;
  game_data: any;
  hints: string[];
  game_template_id: string;
}

interface GameBuilderProps {
  sessionNumber: number;
  lectureNumber: number;
  lectureContent?: string;
  onGameSaved?: () => void;
}

export function GameBuilder({ sessionNumber, lectureNumber, lectureContent, onGameSaved }: GameBuilderProps) {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [sessionData, setSessionData] = useState<{ theme: string; lectureTitle: string } | null>(null);
  const [gameData, setGameData] = useState<LectureGame>({
    session_number: sessionNumber,
    lecture_number: lectureNumber,
    title: "",
    description: "",
    instructions: "",
    game_data: { nodes: [], edges: [] },
    hints: [],
    game_template_id: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiChat, setAiChat] = useState("");

  useEffect(() => {
    loadTemplates();
    loadSessionData();
  }, [sessionNumber, lectureNumber]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('game_templates')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      toast.error('Failed to load templates');
      return;
    }

    setTemplates(data || []);
  };

  const loadSessionData = async () => {
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('sessions_dynamic')
        .select('theme')
        .eq('session_number', sessionNumber)
        .single();

      if (sessionError) throw sessionError;

      // Get lecture data
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures_dynamic')
        .select('title')
        .eq('session_id', (await supabase
          .from('sessions_dynamic')
          .select('id')
          .eq('session_number', sessionNumber)
          .single()).data?.id)
        .eq('lecture_number', lectureNumber)
        .single();

      if (lectureError) throw lectureError;

      setSessionData({
        theme: session?.theme || `Session ${sessionNumber}`,
        lectureTitle: lecture?.title || `Lecture ${lectureNumber}`
      });
    } catch (error) {
      // Fallback to static content if database query fails
      import('@/content/sessions').then(({ sessions }) => {
        const sessionContent = sessions.find(s => s.number === sessionNumber);
        const lectureContent = sessionContent?.lectures.find(l => l.id === `s${sessionNumber}-l${lectureNumber}`);
        
        setSessionData({
          theme: sessionContent?.theme || `Session ${sessionNumber}`,
          lectureTitle: lectureContent?.title || `Lecture ${lectureNumber}`
        });
      });
    }
  };

  const generateGame = async () => {
    if (!selectedTemplate || !lectureContent) {
      toast.error('Please select a template and ensure lecture content is available');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-game-generator', {
        body: {
          sessionNumber,
          lectureNumber,
          lectureContent,
          templateId: selectedTemplate.id,
          gameType: selectedTemplate.category
        }
      });

      if (error) throw error;

      setGameData({
        ...gameData,
        title: `${selectedTemplate.name}: Session ${sessionNumber}, Lecture ${lectureNumber}`,
        description: `Interactive ${selectedTemplate.category} game based on lecture content`,
        instructions: data.instructions,
        game_data: data.gameData,
        hints: data.hints,
        game_template_id: selectedTemplate.id
      });

      setShowPreview(true);
      toast.success('Game generated successfully!');
    } catch (error) {
      console.error('Error generating game:', error);
      toast.error('Failed to generate game');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGame = async () => {
    try {
      const { error } = await supabase
        .from('lecture_games')
        .insert([{
          ...gameData,
          is_published: true
        }]);

      if (error) throw error;

      toast.success('Game saved successfully!');
      onGameSaved?.();
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error('Failed to save game');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'critical-thinking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'systems-thinking': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'problem-solving': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {sessionData && (
            <div className="mb-3">
              <h1 className="text-2xl font-bold">{sessionData.theme}</h1>
              <h2 className="text-xl text-muted-foreground">{sessionData.lectureTitle}</h2>
            </div>
          )}
          <h3 className="text-lg font-semibold">AI Game Builder</h3>
          <p className="text-sm text-muted-foreground">
            Session {sessionNumber}, Lecture {lectureNumber}
          </p>
        </div>
        {showPreview && (
          <div className="flex gap-2">
            <Button onClick={saveGame} className="gap-2">
              <Save className="w-4 h-4" />
              Save Game
            </Button>
          </div>
        )}
      </div>

      {!showPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Selection */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Select Game Template
            </h4>
            <div className="space-y-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* AI Chat & Generation */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Game Designer
            </h4>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe the type of game scenario you want... (optional - AI will use lecture content)"
                value={aiChat}
                onChange={(e) => setAiChat(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={generateGame}
                disabled={!selectedTemplate || isGenerating}
                className="w-full gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? 'Generating Game...' : 'Generate Game with AI'}
              </Button>
              {lectureContent && (
                <div className="text-xs text-muted-foreground p-3 bg-accent rounded">
                  <strong>Lecture content detected:</strong> AI will create scenarios based on your lecture material
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Game Preview */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Details */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Game Details</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={gameData.title}
                  onChange={(e) => setGameData({...gameData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={gameData.description}
                  onChange={(e) => setGameData({...gameData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <Textarea
                  value={gameData.instructions}
                  onChange={(e) => setGameData({...gameData, instructions: e.target.value})}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Hints
                </label>
                <div className="space-y-2">
                  {gameData.hints.map((hint, index) => (
                    <Input
                      key={index}
                      value={hint}
                      onChange={(e) => {
                        const newHints = [...gameData.hints];
                        newHints[index] = e.target.value;
                        setGameData({...gameData, hints: newHints});
                      }}
                      placeholder={`Hint ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Game Canvas Preview */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Game Preview
              </h4>
              <div className="h-96 border rounded-lg overflow-hidden">
                <FlowCanvas
                  storageKey={`game-preview-${Date.now()}`}
                  initialNodes={gameData.game_data?.nodes || []}
                  initialEdges={gameData.game_data?.edges || []}
                  onSave={(data) => setGameData({...gameData, game_data: data})}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}