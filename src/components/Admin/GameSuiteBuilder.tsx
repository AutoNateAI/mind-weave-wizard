import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, CheckCircle, Loader2, Brain, Target, Award } from "lucide-react";

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
          mode: 'batch'
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
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="space-y-6">
              <div>
                <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">AI-Powered Game Suite</h4>
                <p className="text-muted-foreground">
                  Generate three complementary games that systematically enhance different critical thinking heuristics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <h5 className="font-medium">Critical Decision Path</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Enhances:</p>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">Sequential Reasoning</Badge>
                    <Badge variant="outline" className="text-xs">Consequence Evaluation</Badge>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <h5 className="font-medium">Problem Analysis Web</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Enhances:</p>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">Systematic Decomposition</Badge>
                    <Badge variant="outline" className="text-xs">Root Cause Analysis</Badge>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-green-500" />
                    <h5 className="font-medium">System Mapping</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Enhances:</p>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">Holistic Thinking</Badge>
                    <Badge variant="outline" className="text-xs">Relationship Recognition</Badge>
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
                  <CheckCircle className="w-5 h-5 text-green-500" />
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
    </div>
  );
}