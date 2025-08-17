import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, Clock, Target, Lightbulb, TrendingUp, Award } from 'lucide-react';

interface GameAnalyticsData {
  timeSpent: number;
  correctConnections: number;
  incorrectConnections: number;
  hintsUsed: number;
  totalInteractions: number;
  completionScore: number;
  decisionPath: any[];
}

interface GameAnalyticsReportProps {
  analytics: GameAnalyticsData;
  gameTitle: string;
  onClose: () => void;
  onViewFullAnalytics: () => void;
}

export const GameAnalyticsReport: React.FC<GameAnalyticsReportProps> = ({
  analytics,
  gameTitle,
  onClose,
  onViewFullAnalytics
}) => {
  const {
    timeSpent,
    correctConnections,
    incorrectConnections,
    hintsUsed,
    totalInteractions,
    completionScore,
    decisionPath
  } = analytics;

  const totalConnections = correctConnections + incorrectConnections;
  const accuracyRate = totalConnections > 0 ? (correctConnections / totalConnections) * 100 : 0;
  const efficiencyScore = totalInteractions > 0 ? (correctConnections / totalInteractions) * 100 : 0;
  const timePerConnection = correctConnections > 0 ? timeSpent / correctConnections : 0;

  // Critical thinking skill analysis
  const getReasoningStyle = () => {
    if (hintsUsed === 0 && accuracyRate > 80) return 'Independent Analyzer';
    if (hintsUsed > 0 && accuracyRate > 70) return 'Strategic Learner';
    if (incorrectConnections > correctConnections) return 'Experimental Explorer';
    return 'Methodical Builder';
  };

  const getCognitiveEfficiency = () => {
    if (timePerConnection < 15 && accuracyRate > 75) return 'Rapid Pattern Recognition';
    if (timePerConnection < 30 && accuracyRate > 60) return 'Balanced Processing';
    if (timePerConnection > 45) return 'Deliberate Analysis';
    return 'Developing Patterns';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Game Complete!
          </CardTitle>
          <p className="text-muted-foreground">{gameTitle}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(completionScore)}`}>
              {Math.round(completionScore)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Performance</p>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{Math.round(accuracyRate)}%</div>
                <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                <Progress value={accuracyRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
                <p className="text-xs text-muted-foreground">Time Spent</p>
                <div className="text-xs mt-1">{Math.round(timePerConnection)}s per connection</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{Math.round(efficiencyScore)}%</div>
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <Progress value={efficiencyScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{hintsUsed}</div>
                <p className="text-xs text-muted-foreground">Hints Used</p>
                <div className="text-xs mt-1">{totalInteractions} total moves</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Critical Thinking Profile */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Critical Thinking Profile
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reasoning Style:</span>
                <Badge variant="secondary">{getReasoningStyle()}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cognitive Processing:</span>
                <Badge variant="secondary">{getCognitiveEfficiency()}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Learning Approach:</span>
                <Badge variant="secondary">
                  {hintsUsed > 0 ? 'Guided Discovery' : 'Self-Directed'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Key Insights:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {accuracyRate >= 80 && (
                <li>• Strong pattern recognition - you identified connections accurately</li>
              )}
              {hintsUsed === 0 && (
                <li>• Independent problem-solving - completed without assistance</li>
              )}
              {timePerConnection < 20 && (
                <li>• Quick decision-making - processed information efficiently</li>
              )}
              {incorrectConnections <= 2 && (
                <li>• Careful analysis - minimized incorrect attempts</li>
              )}
              {efficiencyScore >= 70 && (
                <li>• Strategic thinking - made purposeful moves</li>
              )}
            </ul>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onViewFullAnalytics} variant="outline" className="flex-1">
              View Full Analytics
            </Button>
            <Button onClick={onClose} className="flex-1">
              Continue Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};