import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { GameFlowCanvas } from "@/components/GraphEditor/GameFlowCanvas";
import { toast } from "sonner";
import { Zap, CheckCircle, Loader2, Brain, Target, Award, Eye } from "lucide-react";

interface GameSuiteBuilderProps {
  sessionNumber: number;
  lectureNumber: number;
  lectureContent?: string;
  onGamesSaved?: () => void;
}

interface GeneratedGame {
  templateId: string;
  templateName: string;
  gameData: any;
  generatedContent: any;
  instructions: string;
  hints: string[];
  heuristicTargets: string[];
  validationRules: any;
  winConditions: any;
}

interface GameSuiteResponse {
  mode: string;
  suiteOverview: string;
  games: GeneratedGame[];
  sessionNumber: number;
  lectureNumber: number;
}

export function GameSuiteBuilder({ sessionNumber, lectureNumber, lectureContent, onGamesSaved }: GameSuiteBuilderProps) {
  const [sessionData, setSessionData] = useState<{ theme: string; lectureTitle: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedSuite, setGeneratedSuite] = useState<GameSuiteResponse | null>(null);
  const [previewGame, setPreviewGame] = useState<GeneratedGame | null>(null);
  const [gameContexts, setGameContexts] = useState({
    criticalDecisionPath: '',
    problemAnalysisWeb: '',
    systemMapping: ''
  });

  useEffect(() => {
    loadSessionData();
  }, [sessionNumber, lectureNumber]);

  const loadSessionData = async () => {
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('sessions_dynamic')
        .select('title, theme')
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
        theme: session?.title || session?.theme || `Session ${sessionNumber}`,
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

  const generateGameSuite = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Analyzing lecture content...');

    try {
      setProgress(20);
      setCurrentStep('Orchestrating game scenarios...');

      console.log('Calling ai-game-generator in batch mode with:', {
        sessionNumber,
        lectureNumber,
        lectureContent,
        mode: 'batch'
      });

      const { data, error } = await supabase.functions.invoke('ai-game-generator', {
        body: {
          sessionNumber,
          lectureNumber,
          lectureContent,
          mode: 'batch',
          gameContexts
        }
      });

      setProgress(60);
      setCurrentStep('Processing heuristic-specific content...');

      console.log('AI game suite generator response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.games) {
        throw new Error('No game suite data returned from AI generator');
      }

      setProgress(90);
      setCurrentStep('Finalizing game suite...');

      setGeneratedSuite(data);
      setProgress(100);
      setCurrentStep('Complete! Review your game suite below.');
      
      toast.success('Game suite generated successfully!');
    } catch (error) {
      console.error('Error generating game suite:', error);
      toast.error(`Failed to generate game suite: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGameSuite = async () => {
    if (!generatedSuite) return;

    setIsSaving(true);
    try {
      const gameInserts = generatedSuite.games.map((game, index) => ({
        session_number: sessionNumber,
        lecture_number: lectureNumber,
        title: `${game.templateName}: Session ${sessionNumber}, Lecture ${lectureNumber}`,
        description: `Enhanced ${game.templateName.toLowerCase()} game targeting ${game.heuristicTargets.join(', ')}`,
        instructions: game.instructions,
        game_data: game.gameData,
        hints: game.hints,
        game_template_id: game.templateId,
        order_index: index,
        is_published: true,
        heuristic_targets: game.heuristicTargets,
        validation_rules: game.validationRules,
        win_conditions: game.winConditions
      }));

      const { error } = await supabase
        .from('lecture_games')
        .insert(gameInserts);

      if (error) throw error;

      toast.success(`Game suite saved successfully! Created ${generatedSuite.games.length} games.`);
      onGamesSaved?.();
    } catch (error) {
      console.error('Error saving game suite:', error);
      toast.error('Failed to save game suite');
    } finally {
      setIsSaving(false);
    }
  };

  const getHeuristicColor = (heuristic: string) => {
    const colors = {
      'Sequential Reasoning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Consequence Evaluation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Systematic Decomposition': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Root Cause Analysis': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      'Holistic Thinking': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Relationship Recognition': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    };
    return colors[heuristic as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Complete Game Suite Builder
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate all three game types with orchestrated heuristic targeting
          </p>
        </div>
        {generatedSuite && (
          <div className="flex gap-2">
            <Button onClick={saveGameSuite} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Game Suite'}
            </Button>
          </div>
        )}
      </div>

      {!generatedSuite ? (
        /* Generation Interface */
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="space-y-8">
              <div>
                <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">AI-Powered Game Suite</h4>
                <p className="text-muted-foreground">
                  Generate three complementary games that systematically enhance different critical thinking heuristics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card className="p-6 group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-base">Critical Decision Path</h5>
                      <p className="text-xs text-muted-foreground">Sequential thinking mastery</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Sequential Reasoning
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        Consequence Evaluation
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <Label htmlFor="critical-context" className="text-sm font-medium">Scenario Context</Label>
                    </div>
                    <div className="relative">
                      <Textarea 
                        id="critical-context"
                        placeholder="e.g., 'Corporate leadership crisis requiring rapid decision-making under uncertainty...'"
                        value={gameContexts.criticalDecisionPath}
                        onChange={(e) => setGameContexts(prev => ({ ...prev, criticalDecisionPath: e.target.value }))}
                        className="min-h-[100px] resize-none border-dashed border-2 focus:border-solid transition-all overflow-hidden scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      />
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-60">
                        Optional
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-base">Problem Analysis Web</h5>
                      <p className="text-xs text-muted-foreground">Systematic decomposition</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Systematic Decomposition
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        Root Cause Analysis
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <Label htmlFor="analysis-context" className="text-sm font-medium">Problem Context</Label>
                    </div>
                    <div className="relative">
                      <Textarea 
                        id="analysis-context"
                        placeholder="e.g., 'Multi-layered organizational inefficiency with interconnected root causes...'"
                        value={gameContexts.problemAnalysisWeb}
                        onChange={(e) => setGameContexts(prev => ({ ...prev, problemAnalysisWeb: e.target.value }))}
                        className="min-h-[100px] resize-none border-dashed border-2 focus:border-solid transition-all overflow-hidden scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      />
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-60">
                        Optional
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-base">System Mapping</h5>
                      <p className="text-xs text-muted-foreground">Holistic relationship mapping</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Holistic Thinking
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Relationship Recognition
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <Label htmlFor="system-context" className="text-sm font-medium">System Context</Label>
                    </div>
                    <div className="relative">
                      <Textarea 
                        id="system-context"
                        placeholder="e.g., 'Complex ecosystem with multiple stakeholders and interdependent variables...'"
                        value={gameContexts.systemMapping}
                        onChange={(e) => setGameContexts(prev => ({ ...prev, systemMapping: e.target.value }))}
                        className="min-h-[100px] resize-none border-dashed border-2 focus:border-solid transition-all overflow-hidden scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      />
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-60">
                        Optional
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {isGenerating && (
                <div className="space-y-3">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{currentStep}</p>
                </div>
              )}

              <Button 
                onClick={generateGameSuite}
                disabled={isGenerating}
                size="lg"
                className="w-full max-w-md gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isGenerating ? 'Generating Suite...' : 'Generate Complete Game Suite'}
              </Button>

              {lectureContent && (
                <div className="text-xs text-muted-foreground p-3 bg-accent rounded">
                  <strong>Lecture content detected:</strong> AI will create coordinated scenarios based on your lecture material with targeted heuristic enhancement
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Generated Suite Preview */
        <div className="space-y-6">
          {/* Suite Overview */}
          <Card className="p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Game Suite Overview
            </h4>
            <p className="text-sm text-muted-foreground mb-4">{generatedSuite.suiteOverview}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{generatedSuite.games.length} Games Created</Badge>
              <Badge variant="outline">Session {sessionNumber}</Badge>
              <Badge variant="outline">Lecture {lectureNumber}</Badge>
            </div>
          </Card>

          {/* Generated Games */}
          <div className="grid gap-6">
            {generatedSuite.games.map((game, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-lg mb-1">{game.templateName}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{game.instructions}</p>
                    <div className="flex flex-wrap gap-1">
                      {game.heuristicTargets.map((heuristic, heuristicIndex) => (
                        <Badge 
                          key={heuristicIndex} 
                          className={getHeuristicColor(heuristic)}
                        >
                          {heuristic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewGame(game)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h6 className="font-medium mb-1">Hints ({game.hints.length})</h6>
                    <ul className="text-muted-foreground space-y-1">
                      {game.hints.slice(0, 2).map((hint, hintIndex) => (
                        <li key={hintIndex}>• {hint}</li>
                      ))}
                      {game.hints.length > 2 && <li>• ... and more</li>}
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium mb-1">Game Elements</h6>
                    <p className="text-muted-foreground">
                      {game.gameData.nodes?.length || 0} nodes, {game.gameData.edges?.length || 0} connections
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Game Preview Dialog */}
      <Dialog open={!!previewGame} onOpenChange={() => setPreviewGame(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Game Preview: {previewGame?.templateName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewGame && (
              <GameFlowCanvas
                gameId={`preview-${Date.now()}`}
                gameData={previewGame.gameData}
                hints={previewGame.hints}
                mechanics={{
                  canConnect: true,
                  canDrag: true,
                  canDelete: false
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}