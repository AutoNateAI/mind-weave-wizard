import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, Clock, Target, Lightbulb, Award, CheckCircle, Zap,
  Activity, TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

interface GameAnalyticsData {
  timeSpent: number;
  correctConnections: number;
  incorrectConnections: number;
  hintsUsed: number;
  totalInteractions: number;
  completionScore: number;
  decisionPath: any[];
}

interface GameCompletionReportProps {
  analytics: GameAnalyticsData;
  gameTitle: string;
  onClose: () => void;
  onViewFullAnalytics: () => void;
}

export const GameCompletionReport: React.FC<GameCompletionReportProps> = ({
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

  // Calculate critical thinking metrics (normalized 0-100)
  const attempts = correctConnections + incorrectConnections;
  const totalRequired = (analytics as any)?.totalRequiredConnections ?? 0;
  const minutes = Math.max(1 / 60, timeSpent / 60);

  // Error recovery: how often a wrong is followed by a right on the next move
  const history = Array.isArray(decisionPath) ? decisionPath : [];
  let wrongs = 0;
  let corrections = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const cur = history[i];
    const nxt = history[i + 1];
    if (cur?.action === 'connected' && cur?.isCorrect === false) {
      wrongs++;
      if (nxt?.action === 'connected' && nxt?.isCorrect === true) {
        corrections++;
      }
    }
  }
  const errorRecovery = wrongs > 0 ? (corrections / wrongs) * 100 : (correctConnections > 0 ? 100 : 0);

  const patternRecognition = attempts > 0 ? (correctConnections / attempts) * 100 : 0;
  const strategicReasoning = totalRequired > 0 ? (correctConnections / totalRequired) * 100 : patternRecognition;

  const targetRate = 2; // connections per minute
  const rate = correctConnections / minutes;
  const cognitiveEfficiency = Math.min(100, Math.max(0, (rate / targetRate) * 100));

  const hintImpact = totalRequired > 0 ? Math.min(60, (hintsUsed / totalRequired) * 60) : Math.min(60, hintsUsed * 15);
  const errorImpact = attempts > 0 ? (incorrectConnections / attempts) * 40 : 0;
  const metacognition = Math.min(100, Math.max(0, 100 - hintImpact - errorImpact));

  const sessionMetrics = {
    patternRecognition,
    strategicReasoning,
    metacognition,
    cognitiveEfficiency,
    errorRecovery,
  };

  const metrics = [
    { 
      name: 'Pattern Recognition', 
      value: sessionMetrics.patternRecognition, 
      color: 'hsl(var(--primary))',
      description: 'Ability to identify logical relationships'
    },
    { 
      name: 'Strategic Reasoning', 
      value: sessionMetrics.strategicReasoning, 
      color: 'rgb(34, 197, 94)',
      description: 'Systematic vs random problem approach'
    },
    { 
      name: 'Metacognition', 
      value: sessionMetrics.metacognition, 
      color: 'hsl(var(--accent))',
      description: 'Self-assessment and help-seeking behavior'
    },
    { 
      name: 'Cognitive Efficiency', 
      value: sessionMetrics.cognitiveEfficiency, 
      color: 'rgb(249, 115, 22)',
      description: 'Balance of speed and accuracy'
    },
    { 
      name: 'Error Recovery', 
      value: sessionMetrics.errorRecovery, 
      color: 'rgb(59, 130, 246)',
      description: 'Adaptability and learning from mistakes'
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-6 h-6" />
            {gameTitle} - Detailed Analytics
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-xl font-bold">{Math.round(completionScore)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-xl font-bold">
                      {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-xl font-bold">{correctConnections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hints Used</p>
                    <p className="text-xl font-bold">{hintsUsed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Correct', value: correctConnections, fill: '#22c55e' },
                        { name: 'Incorrect', value: incorrectConnections, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Session Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Accuracy Rate</span>
                    <Badge variant="default">
                      {correctConnections + incorrectConnections > 0 
                        ? Math.round((correctConnections / (correctConnections + incorrectConnections)) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Efficiency</span>
                    <Badge variant="secondary">
                      {timeSpent > 0 
                        ? Math.round((correctConnections / (timeSpent / 60)) * 10) / 10
                        : 0} connections/min
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Strategy Score</span>
                    <Badge variant={hintsUsed <= 2 ? "default" : "outline"}>
                      {hintsUsed <= 2 ? "Strategic" : "Learning Mode"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Interactions</span>
                    <span className="font-bold">{totalInteractions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Thinking Profile - Full Width */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Critical Thinking Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Visual Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {metrics.map((metric, index) => (
                    <div key={metric.name} className="text-center space-y-3">
                      <div className="relative">
                        <div className="w-20 h-20 mx-auto relative">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-muted stroke-current"
                              fill="none"
                              strokeWidth="3"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="stroke-current animate-fade-in"
                              fill="none"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${metric.value}, 100`}
                              style={{ color: metric.color }}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold" style={{ color: metric.color }}>
                              {Math.round(metric.value)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{metric.name}</div>
                        <div className="text-xs text-muted-foreground">{metric.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Insights */}
                <div className="mt-8 p-6 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Session Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>
                        <strong>Top Skill:</strong> {metrics.reduce((a, b) => a.value > b.value ? a : b).name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>
                        <strong>Focus Area:</strong> {metrics.reduce((a, b) => a.value < b.value ? a : b).name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>
                        <strong>Overall Performance:</strong> {
                          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length > 80 ? 'Excellent' :
                          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length > 60 ? 'Good' : 'Developing'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onViewFullAnalytics} variant="outline" className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Analytics Dashboard
            </Button>
            <Button onClick={onClose} className="flex-1">
              Continue Learning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};