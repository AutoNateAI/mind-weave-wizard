import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Brain, TrendingUp, Clock, Target, Award, Calendar,
  ChevronRight, Lightbulb, Activity, Users, X, Zap, CheckCircle, XCircle, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GameSession {
  id: string;
  lecture_game_id: string;
  started_at: string;
  completed_at: string;
  time_spent_seconds: number;
  correct_connections: number;
  incorrect_connections: number;
  hints_used: number;
  completion_score: number;
  total_interactions: number;
  decision_path?: any; // JSON type from database
  lecture_games: {
    title: string;
    session_number: number;
    lecture_number: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLecture, setSelectedLecture] = useState<string>('all');
  const sessionsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchAllAnalyticsData();
    }
  }, [user]);

  const fetchAllAnalyticsData = async () => {
    try {
      // Fetch game analytics data
      const { data: gameData, error: gameError } = await supabase
        .from('game_analytics')
        .select(`
          *,
          lecture_games (
            title,
            session_number,
            lecture_number
          )
        `)
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      if (gameError) throw gameError;

      // Fetch user reflections
      const { data: reflectionData, error: reflectionError } = await supabase
        .from('user_reflections')
        .select(`
          *,
          reflection_questions (
            question_text,
            session_number,
            lecture_number
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reflectionError) throw reflectionError;

      // Fetch quiz answers
      const { data: quizData, error: quizError } = await supabase
        .from('user_quiz_answers')
        .select(`
          *,
          multiple_choice_questions (
            question_text,
            session_number,
            lecture_number,
            correct_option
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (quizError) throw quizError;

      setSessions(gameData || []);
      setReflections(reflectionData || []);
      setQuizAnswers(quizData || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Aggregate statistics
  const totalSessions = sessions.length;
  const totalReflections = reflections.length;
  const totalQuizzes = quizAnswers.length;
  const avgScore = sessions.length > 0 ? 
    sessions.reduce((sum, s) => sum + (s.completion_score || 0), 0) / sessions.length : 0;
  const totalTime = sessions.reduce((sum, s) => sum + s.time_spent_seconds, 0);
  const avgAccuracy = sessions.length > 0 ? 
    sessions.reduce((sum, s) => {
      const total = s.correct_connections + s.incorrect_connections;
      return sum + (total > 0 ? (s.correct_connections / total) * 100 : 0);
    }, 0) / sessions.length : 0;
  const quizAccuracy = quizAnswers.length > 0 ?
    (quizAnswers.filter(q => q.is_correct).length / quizAnswers.length) * 100 : 0;

  // Critical thinking metrics
  const problemSolvingEfficiency = sessions.length > 0 ? 
    sessions.reduce((sum, s) => sum + (s.correct_connections / (s.time_spent_seconds / 60)), 0) / sessions.length : 0;
  
  const adaptabilityScore = sessions.length > 0 ? 
    100 - (sessions.reduce((sum, s) => sum + s.incorrect_connections, 0) / sessions.length * 10) : 0;
  
  const strategicThinkingScore = sessions.length > 0 ? 
    100 - (sessions.reduce((sum, s) => sum + s.hints_used, 0) / sessions.length * 15) : 0;

  // Enhanced Critical Thinking Analytics
  const calculateCriticalThinkingMetrics = () => {
    if (sessions.length === 0) return null;

    // 1. Connection Accuracy & Pattern Recognition
    const totalConnections = sessions.reduce((sum, s) => sum + s.correct_connections + s.incorrect_connections, 0);
    const patternRecognitionScore = totalConnections > 0 ? 
      (sessions.reduce((sum, s) => sum + s.correct_connections, 0) / totalConnections) * 100 : 0;

    // 2. Decision Path & Problem-Solving Strategy (analyze decision_path for patterns)
    const strategicReasoningScore = sessions.reduce((sum, s) => {
      const path = s.decision_path ? JSON.parse(s.decision_path as any) : [];
      const pathLength = Array.isArray(path) ? path.length : 0;
      const efficiency = pathLength > 0 ? (s.correct_connections / pathLength) * 100 : 0;
      return sum + efficiency;
    }, 0) / sessions.length;

    // 3. Hint Usage & Self-Directed Learning
    const avgHintsUsed = sessions.reduce((sum, s) => sum + s.hints_used, 0) / sessions.length;
    const metacognitionScore = Math.max(0, 100 - (avgHintsUsed * 20)); // Less hints = better self-assessment

    // 4. Time Management & Cognitive Efficiency
    const avgTimePerConnection = sessions.reduce((sum, s) => {
      const timePerConnection = s.correct_connections > 0 ? s.time_spent_seconds / s.correct_connections : 0;
      return sum + timePerConnection;
    }, 0) / sessions.length;
    const cognitiveEfficiencyScore = Math.max(0, 100 - (avgTimePerConnection / 60) * 10); // Faster = more efficient

    // 5. Error Recovery & Adaptability  
    const errorRecoveryScore = sessions.reduce((sum, s) => {
      const incorrectRatio = s.incorrect_connections / Math.max(1, s.correct_connections + s.incorrect_connections);
      const recoveryScore = Math.max(0, 100 - (incorrectRatio * 100));
      return sum + recoveryScore;
    }, 0) / sessions.length;

    return {
      patternRecognition: Math.min(100, patternRecognitionScore),
      strategicReasoning: Math.min(100, strategicReasoningScore),
      metacognition: Math.min(100, metacognitionScore),
      cognitiveEfficiency: Math.min(100, cognitiveEfficiencyScore),
      errorRecovery: Math.min(100, errorRecoveryScore)
    };
  };

  const criticalThinkingMetrics = calculateCriticalThinkingMetrics();

  // Enhanced skill radar data using critical thinking metrics
  const skillData = criticalThinkingMetrics ? [
    {
      skill: 'Pattern Recognition',
      score: criticalThinkingMetrics.patternRecognition,
      description: 'Ability to identify logical relationships'
    },
    {
      skill: 'Strategic Reasoning',
      score: criticalThinkingMetrics.strategicReasoning,
      description: 'Systematic vs random problem approach'
    },
    {
      skill: 'Metacognition',
      score: criticalThinkingMetrics.metacognition,
      description: 'Self-assessment and help-seeking behavior'
    },
    {
      skill: 'Cognitive Efficiency',
      score: criticalThinkingMetrics.cognitiveEfficiency,
      description: 'Balance of speed and accuracy'
    },
    {
      skill: 'Error Recovery',
      score: criticalThinkingMetrics.errorRecovery,
      description: 'Adaptability and learning from mistakes'
    }
  ] : [];

  // Learning Journey Timeline Data (last 10 sessions)
  const learningJourneyData = sessions.slice(-10).reverse().map((session, index) => {
    const path = session.decision_path ? JSON.parse(session.decision_path as any) : [];
    const pathLength = Array.isArray(path) ? path.length : 0;
    const efficiency = pathLength > 0 ? (session.correct_connections / pathLength) * 100 : 0;
    
    return {
      session: `Game ${sessions.length - 9 + index}`,
      patternRecognition: session.correct_connections / Math.max(1, session.correct_connections + session.incorrect_connections) * 100,
      strategicReasoning: efficiency,
      metacognition: Math.max(0, 100 - (session.hints_used * 20)),
      cognitiveEfficiency: Math.max(0, 100 - (session.time_spent_seconds / Math.max(1, session.correct_connections) / 60) * 10),
      errorRecovery: Math.max(0, 100 - (session.incorrect_connections / Math.max(1, session.correct_connections + session.incorrect_connections) * 100))
    };
  });

  // Game performance over time (last 10 sessions)
  const gameProgressData = sessions.slice(-10).reverse().map((session, index) => ({
    session: `Game ${sessions.length - 9 + index}`,
    completion_score: session.completion_score || 0,
    accuracy: session.correct_connections + session.incorrect_connections > 0 ? 
      (session.correct_connections / (session.correct_connections + session.incorrect_connections)) * 100 : 0,
    efficiency: session.time_spent_seconds > 0 ? 
      (session.correct_connections / (session.time_spent_seconds / 60)) * 10 : 0
  }));

  // Quiz performance over time
  const quizProgressData = quizAnswers.slice(-10).reverse().map((answer, index) => ({
    quiz: `Quiz ${quizAnswers.length - 9 + index}`,
    accuracy: answer.is_correct ? 100 : 0,
    session: answer.multiple_choice_questions?.session_number || 0
  }));

  // Filter sessions based on selected module and lecture
  const filteredSessions = sessions.filter(session => {
    if (selectedModule && selectedModule !== 'all' && session.lecture_games?.session_number.toString() !== selectedModule) {
      return false;
    }
    if (selectedLecture && selectedLecture !== 'all' && session.lecture_games?.lecture_number.toString() !== selectedLecture) {
      return false;
    }
    return true;
  });

  // Get unique modules and lectures for filter dropdowns
  const uniqueModules = Array.from(new Set(
    sessions.map(s => s.lecture_games?.session_number).filter(Boolean)
  )).sort((a, b) => a - b);

  const uniqueLectures = Array.from(new Set(
    sessions
      .filter(s => !selectedModule || selectedModule === 'all' || s.lecture_games?.session_number.toString() === selectedModule)
      .map(s => s.lecture_games?.lecture_number)
      .filter(Boolean)
  )).sort((a, b) => a - b);

  // Reset current page when filters change
  const handleModuleChange = (value: string) => {
    setSelectedModule(value);
    setSelectedLecture('all'); // Reset lecture when module changes
    setCurrentPage(1);
  };

  const handleLectureChange = (value: string) => {
    setSelectedLecture(value);
    setCurrentPage(1);
  };
  // Targeted Recommendations based on performance
  const generateRecommendations = () => {
    if (!criticalThinkingMetrics) return [];
    
    const recommendations = [];
    
    if (criticalThinkingMetrics.patternRecognition < 70) {
      recommendations.push({
        area: 'Pattern Recognition',
        recommendation: 'Focus on foundational concept review and practice identifying logical relationships',
        priority: 'High'
      });
    }
    
    if (criticalThinkingMetrics.strategicReasoning < 60) {
      recommendations.push({
        area: 'Strategic Reasoning',
        recommendation: 'Work on systematic problem-solving approaches rather than random exploration',
        priority: 'High'
      });
    }
    
    if (criticalThinkingMetrics.metacognition < 50) {
      recommendations.push({
        area: 'Self-Assessment',
        recommendation: 'Practice recognizing when you need help and develop independent problem-solving confidence',
        priority: 'Medium'
      });
    }
    
    if (criticalThinkingMetrics.cognitiveEfficiency < 60) {
      recommendations.push({
        area: 'Cognitive Efficiency',
        recommendation: 'Balance speed with accuracy - take time to think through problems systematically',
        priority: 'Medium'
      });
    }
    
    if (criticalThinkingMetrics.errorRecovery < 70) {
      recommendations.push({
        area: 'Error Recovery',
        recommendation: 'Focus on learning from mistakes and adapting strategy when initial approaches fail',
        priority: 'High'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Game Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reflections</p>
                <p className="text-2xl font-bold">{totalReflections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quiz Answers</p>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quiz Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(quizAccuracy)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{Math.floor(totalTime / 3600)}h {Math.floor((totalTime % 3600) / 60)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Critical Thinking Profile</TabsTrigger>
          <TabsTrigger value="journey">Learning Journey</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="sessions">Games</TabsTrigger>
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Game Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={gameProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => [`${Math.round(value as number)}%`, name]} />
                    <Area type="monotone" dataKey="completion_score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Completion Score" />
                    <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} name="Accuracy" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Critical Thinking Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Critical Thinking Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {criticalThinkingMetrics ? (
                  <div className="space-y-4">
                    {Object.entries(criticalThinkingMetrics).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No data available for analysis</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Learning Journey Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={learningJourneyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value, name) => [`${Math.round(value as number)}%`, name]} />
                  <Line type="monotone" dataKey="patternRecognition" stroke="#8884d8" name="Pattern Recognition" />
                  <Line type="monotone" dataKey="strategicReasoning" stroke="#82ca9d" name="Strategic Reasoning" />
                  <Line type="monotone" dataKey="metacognition" stroke="#ffc658" name="Metacognition" />
                  <Line type="monotone" dataKey="cognitiveEfficiency" stroke="#ff7300" name="Cognitive Efficiency" />
                  <Line type="monotone" dataKey="errorRecovery" stroke="#8dd1e1" name="Error Recovery" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Targeted Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rec.area}</h4>
                        <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Excellent Performance!</h3>
                    <p className="text-muted-foreground">You're demonstrating strong critical thinking skills across all areas. Keep up the great work!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filter Controls */}
                <div className="flex gap-4 items-center">
                  <div className="w-48">
                    <Select value={selectedModule} onValueChange={handleModuleChange}>
                      <SelectTrigger className="bg-background border">
                        <SelectValue placeholder="Filter by Module" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="all">All Modules</SelectItem>
                        {uniqueModules.map(moduleNum => (
                          <SelectItem key={moduleNum} value={moduleNum.toString()}>
                            <div>
                              <div className="font-medium">Session {moduleNum}</div>
                              <div className="text-xs text-muted-foreground">Module {moduleNum}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-48">
                    <Select value={selectedLecture} onValueChange={handleLectureChange}>
                      <SelectTrigger className="bg-background border">
                        <SelectValue placeholder="Filter by Lecture" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="all">All Lectures</SelectItem>
                        {uniqueLectures.map(lectureNum => (
                          <SelectItem key={lectureNum} value={lectureNum.toString()}>
                            <div>
                              <div className="font-medium">Lecture {lectureNum}</div>
                              <div className="text-xs text-muted-foreground">Lecture {lectureNum}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedModule !== 'all' || selectedLecture !== 'all') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedModule('all');
                        setSelectedLecture('all');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Pagination Info */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * sessionsPerPage + 1, filteredSessions.length)} to {Math.min(currentPage * sessionsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * sessionsPerPage >= filteredSessions.length}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-2">
                  {filteredSessions
                    .slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage)
                    .map((session) => (
                    <div key={session.id} 
                         className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                         onClick={() => setSelectedSession(session)}>
                      <div>
                        <p className="font-medium">{session.lecture_games?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString()} • 
                          Session {session.lecture_games?.session_number} - Lecture {session.lecture_games?.lecture_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={session.completion_score >= 80 ? "default" : "secondary"}>
                            {Math.round(session.completion_score || 0)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {session.correct_connections}C / {session.incorrect_connections}I / {session.hints_used}H
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                  {filteredSessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {selectedModule !== 'all' || selectedLecture !== 'all' ? 'No sessions found matching the selected filters.' : 'No game sessions completed yet.'}
                    </p>
                  )}
                </div>

                {/* Smart Pagination */}
                {filteredSessions.length > sessionsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {(() => {
                      const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
                      const pages = [];
                      
                      // Always show first page
                      if (totalPages > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                        );
                      }
                      
                      // Show ellipsis if current page is far from start
                      if (currentPage > 4) {
                        pages.push(<span key="start-ellipsis" className="px-2">...</span>);
                      }
                      
                      // Show pages around current page
                      const startPage = Math.max(2, currentPage - 1);
                      const endPage = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        if (i !== 1 && i !== totalPages) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className="w-8 h-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }
                      }
                      
                      // Show ellipsis if current page is far from end
                      if (currentPage < totalPages - 3) {
                        pages.push(<span key="end-ellipsis" className="px-2">...</span>);
                      }
                      
                      // Always show last page if more than 1 page
                      if (totalPages > 1) {
                        pages.push(
                          <Button
                            key={totalPages}
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * sessionsPerPage >= filteredSessions.length}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reflections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reflections.map((reflection) => (
                  <div key={reflection.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground">
                        Session {reflection.session_number} - Lecture {reflection.lecture_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reflection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {reflection.reflection_questions && (
                      <p className="font-medium text-sm mb-2">{reflection.reflection_questions.question_text}</p>
                    )}
                    <p className="text-sm">{reflection.reflection_content}</p>
                  </div>
                ))}
                {reflections.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No reflections completed yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizAnswers.map((answer) => (
                  <div key={answer.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground">
                        Session {answer.multiple_choice_questions?.session_number} - Lecture {answer.multiple_choice_questions?.lecture_number}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={answer.is_correct ? "default" : "destructive"}>
                          {answer.is_correct ? "Correct" : "Incorrect"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(answer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {answer.multiple_choice_questions && (
                      <div>
                        <p className="font-medium text-sm mb-2">{answer.multiple_choice_questions.question_text}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={answer.is_correct ? "text-green-600" : "text-red-600"}>
                            {answer.selected_option}
                          </span>
                          {!answer.is_correct && (
                            <>
                              <span className="text-muted-foreground"> | Correct: </span>
                              <span className="text-green-600">{answer.multiple_choice_questions.correct_option}</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {quizAnswers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No quiz answers recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Game Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {selectedSession?.lecture_games?.title} - Detailed Analytics
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-xl font-bold">{Math.round(selectedSession.completion_score || 0)}%</p>
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
                          {Math.floor(selectedSession.time_spent_seconds / 60)}:{(selectedSession.time_spent_seconds % 60).toString().padStart(2, '0')}
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
                        <p className="text-xl font-bold">{selectedSession.correct_connections}</p>
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
                        <p className="text-xl font-bold">{selectedSession.hints_used}</p>
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
                            { name: 'Correct', value: selectedSession.correct_connections, fill: '#22c55e' },
                            { name: 'Incorrect', value: selectedSession.incorrect_connections, fill: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        />
                        <Tooltip />
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
                          {selectedSession.correct_connections + selectedSession.incorrect_connections > 0 
                            ? Math.round((selectedSession.correct_connections / (selectedSession.correct_connections + selectedSession.incorrect_connections)) * 100)
                            : 0}%
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Efficiency</span>
                        <Badge variant="secondary">
                          {selectedSession.time_spent_seconds > 0 
                            ? Math.round((selectedSession.correct_connections / (selectedSession.time_spent_seconds / 60)) * 10) / 10
                            : 0} connections/min
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Strategy Score</span>
                        <Badge variant={selectedSession.hints_used <= 2 ? "default" : "outline"}>
                          {selectedSession.hints_used <= 2 ? "Strategic" : "Learning Mode"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Total Interactions</span>
                        <span className="font-bold">{selectedSession.total_interactions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Started:</p>
                      <p className="font-medium">{new Date(selectedSession.started_at).toLocaleString()}</p>
                    </div>
                    {selectedSession.completed_at && (
                      <div>
                        <p className="text-muted-foreground">Completed:</p>
                        <p className="font-medium">{new Date(selectedSession.completed_at).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Session:</p>
                      <p className="font-medium">Session {selectedSession.lecture_games?.session_number} - Lecture {selectedSession.lecture_games?.lecture_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Game Type:</p>
                      <p className="font-medium">{selectedSession.lecture_games?.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};