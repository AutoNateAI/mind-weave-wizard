import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, Clock, Target, Lightbulb, Award, CheckCircle, Zap,
  Activity, TrendingUp, Mail, User, Download, Share2, ArrowRight, Trophy
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip,
  RadialBarChart, RadialBar
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GameAnalyticsData {
  timeSpent: number;
  correctConnections: number;
  incorrectConnections: number;
  hintsUsed: number;
  totalInteractions: number;
  completionScore: number;
  decisionPath: any[];
}

interface PublicGameReportProps {
  analytics: GameAnalyticsData;
  gameTitle: string;
  gameTemplateId: string;
  onClose: () => void;
  onLeadCaptured: (leadData: any) => void;
}

export const PublicGameReport: React.FC<PublicGameReportProps> = ({
  analytics,
  gameTitle,
  gameTemplateId,
  onClose,
  onLeadCaptured
}) => {
  const [showLeadCapture, setShowLeadCapture] = useState(true);
  const [leadData, setLeadData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const {
    timeSpent,
    correctConnections,
    incorrectConnections,
    hintsUsed,
    totalInteractions,
    completionScore,
    decisionPath
  } = analytics;

  // Calculate critical thinking metrics
  const attempts = correctConnections + incorrectConnections;
  const accuracyRate = attempts > 0 ? (correctConnections / attempts) * 100 : 0;
  const efficiency = totalInteractions > 0 ? (correctConnections / totalInteractions) * 100 : 0;
  const strategyScore = Math.max(0, 100 - (hintsUsed * 10) - (timeSpent > 600 ? 20 : 0));
  const overallPerformance = (accuracyRate + efficiency + strategyScore + completionScore) / 4;

  // Chart data
  const performanceData = [
    { name: 'Correct', value: correctConnections, color: '#10B981' },
    { name: 'Incorrect', value: incorrectConnections, color: '#EF4444' }
  ];

  const criticalThinkingMetrics = [
    { name: 'Accuracy', value: Math.round(accuracyRate), max: 100, color: '#3B82F6' },
    { name: 'Efficiency', value: Math.round(efficiency), max: 100, color: '#8B5CF6' },
    { name: 'Strategy', value: Math.round(strategyScore), max: 100, color: '#F59E0B' }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 85) return { level: 'Expert', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { level: 'Intermediate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Developing', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const performanceLevel = getPerformanceLevel(overallPerformance);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadData.name || !leadData.email) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save lead to database
      const { error } = await supabase
        .from('public_game_leads')
        .insert({
          name: leadData.name,
          email: leadData.email,
          game_template_id: gameTemplateId,
          game_title: gameTitle,
          completion_score: completionScore,
          analytics_data: analytics as any,
          completion_time_seconds: timeSpent
        });

      if (error) throw error;

      // Send email with detailed report
      await supabase.functions.invoke('send-game-report', {
        body: {
          name: leadData.name,
          email: leadData.email,
          gameTitle,
          analytics: {
            ...analytics,
            accuracyRate,
            efficiency,
            strategyScore,
            overallPerformance,
            performanceLevel: performanceLevel.level
          }
        }
      });

      setReportSubmitted(true);
      setShowLeadCapture(false);
      onLeadCaptured(leadData);
      
      toast.success('Report sent to your email! Check your inbox.', {
        icon: <Mail className="w-4 h-4 text-green-500" />
      });

    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to send report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInsights = () => {
    const insights = [];
    
    if (accuracyRate >= 80) {
      insights.push("Excellent decision accuracy! You demonstrate strong analytical thinking.");
    } else if (accuracyRate >= 60) {
      insights.push("Good decision making with room for improvement in pattern recognition.");
    } else {
      insights.push("Focus on understanding relationships between system components.");
    }

    if (hintsUsed === 0) {
      insights.push("Outstanding! You solved this entirely through independent reasoning.");
    } else if (hintsUsed <= 1) {
      insights.push("Great self-reliance with minimal external guidance needed.");
    }

    if (timeSpent < 300) {
      insights.push("Impressive speed! You quickly identified key connections.");
    } else if (timeSpent > 900) {
      insights.push("Take time to understand, but consider practicing pattern recognition.");
    }

    return insights;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {gameTitle} - Performance Analysis
          </DialogTitle>
        </DialogHeader>

        {/* Lead Capture Form */}
        {showLeadCapture && !reportSubmitted && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5" />
                Get Your Detailed Performance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Enter your details to receive a comprehensive analysis of your critical thinking performance, 
                personalized insights, and recommendations for improvement.
              </p>
              <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={leadData.name}
                    onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={leadData.email}
                    onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Sending...' : 'Send Report'}
                  <Mail className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                We'll also send you insights about AutoNate's full critical thinking course.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Performance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="p-4">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-primary">{Math.round(completionScore)}</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatTime(timeSpent)}</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{correctConnections}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{hintsUsed}/3</div>
              <div className="text-sm text-muted-foreground">Hints Used</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown and Critical Thinking Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Critical Thinking Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalThinkingMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>
                      {metric.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${metric.value}%`,
                        backgroundColor: metric.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Level and Insights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${performanceLevel.bg} ${performanceLevel.color} border-0 px-3 py-1`}>
                {performanceLevel.level} Level
              </Badge>
              <span className="text-2xl font-bold">{Math.round(overallPerformance)}%</span>
              <span className="text-muted-foreground">Overall Performance</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium mb-2">Key Insights:</h4>
              {getInsights().map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Level Up Your Critical Thinking?</h3>
            <p className="text-muted-foreground mb-4">
              Join AutoNate's complete course with 10 sessions, 30 interactive games, 
              and AI-powered coaching to master critical thinking for software engineering.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.open('https://calendly.com/autonate-ai/15-min-discovery-call', '_blank')}
              >
                Book Discovery Call
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={onClose}>
                Play Another Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};