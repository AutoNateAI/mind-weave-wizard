import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Brain, TrendingUp, Clock, Target, Award, Calendar,
  ChevronRight, Lightbulb, Activity, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

  // Skill radar data
  const skillData = [
    {
      skill: 'Pattern Recognition',
      score: Math.min(100, avgAccuracy + 10)
    },
    {
      skill: 'Problem Solving',
      score: Math.min(100, avgScore)
    },
    {
      skill: 'Decision Speed',
      score: Math.min(100, sessions.length > 0 ? 
        100 - (sessions.reduce((sum, s) => sum + (s.time_spent_seconds / s.correct_connections || 0), 0) / sessions.length) : 0)
    },
    {
      skill: 'Strategic Thinking',
      score: Math.min(100, sessions.length > 0 ? 
        100 - (sessions.reduce((sum, s) => sum + s.hints_used, 0) / sessions.length * 10) : 0)
    },
    {
      skill: 'Adaptability',
      score: Math.min(100, 100 - (sessions.reduce((sum, s) => sum + s.incorrect_connections, 0) / sessions.length * 5))
    }
  ];

  // Progress over time data
  const progressData = sessions.slice(-10).reverse().map((session, index) => ({
    session: `Session ${index + 1}`,
    score: session.completion_score || 0,
    accuracy: session.correct_connections + session.incorrect_connections > 0 ? 
      (session.correct_connections / (session.correct_connections + session.incorrect_connections)) * 100 : 0,
    efficiency: session.total_interactions > 0 ? 
      (session.correct_connections / session.total_interactions) * 100 : 0
  }));

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
          <TabsTrigger value="skills">Skills Profile</TabsTrigger>
          <TabsTrigger value="sessions">Games</TabsTrigger>
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.slice(0, 5).map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{session.lecture_games?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Session {session.lecture_games?.session_number} - Lecture {session.lecture_games?.lecture_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.completion_score >= 80 ? "default" : session.completion_score >= 60 ? "secondary" : "outline"}>
                          {Math.round(session.completion_score || 0)}%
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(session.time_spent_seconds / 60)}:{(session.time_spent_seconds % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Critical Thinking Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Skills" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skill Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skillData.map((skill) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(skill.score)}%</span>
                      </div>
                      <Progress value={skill.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.id} 
                       className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
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
    </div>
  );
};