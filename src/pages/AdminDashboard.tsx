import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BookOpen, 
  Settings, 
  BarChart3, 
  Users,
  Wand2,
  FileText,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/components/Admin/AdminHeader";
import { CoursePlanningChat } from "@/components/Admin/CoursePlanningChat";
import { CourseStructureView } from "@/components/Admin/CourseStructureView";
import { ChatHistoryView } from "@/components/Admin/ChatHistoryView";
import { PageMeta } from "@/components/UI/PageMeta";
import { useAdminViewSwitch } from "@/hooks/useAdminViewSwitch";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { isStudentView } = useAdminViewSwitch();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Direct admin check - don't rely on the hook
  const isAdmin = user?.email === 'admin@gmail.com';

  console.log('🏛️ AdminDashboard render:', { 
    userEmail: user?.email, 
    loading, 
    isAdmin,
    directAdminCheck: user?.email === 'admin@gmail.com',
    pathname: window.location.pathname
  });

  useEffect(() => {
    console.log('🏛️ AdminDashboard useEffect:', { isAdmin });
    if (isAdmin) {
      loadCourses();
    }
  }, [isAdmin]);

  // Show loading while auth is still checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admin users only after auth has loaded
  if (user && !isAdmin) {
    console.log('🚨 AdminDashboard REDIRECT: Non-admin user detected', { 
      userEmail: user?.email, 
      isAdmin, 
      userObject: user 
    });
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ AdminDashboard: Admin check passed', { userEmail: user?.email, isAdmin });

  const loadCourses = async () => {
    try {
      console.log('🔍 Loading courses...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Courses query result:', { data, error });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const handleCoursePlanned = (courseData: any) => {
    setSelectedCourse(courseData.course.id);
    setActiveTab('structure');
    loadCourses();
    toast.success('Course structure created! Now you can generate content.');
  };

  return (
    <>
      <PageMeta 
        title="Admin Dashboard"
        description="AI-powered course generation and management system"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <AdminHeader />
        
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold cyber-glow">Admin Dashboard</h1>
              <p className="text-muted-foreground">AI-powered course generation and management</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-2">
                <Wand2 className="w-3 h-3" />
                AI Powered
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="planning" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Course Planning
              </TabsTrigger>
              <TabsTrigger value="chat-history" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat History
              </TabsTrigger>
              <TabsTrigger value="structure" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Course Structure
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{courses.length}</h3>
                      <p className="text-muted-foreground">Total Courses</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <Users className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">-</h3>
                      <p className="text-muted-foreground">Active Students</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                      <Wand2 className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">AI</h3>
                      <p className="text-muted-foreground">Content Generator</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Courses</h3>
                  <Button onClick={() => setActiveTab('planning')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Course
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {courses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No courses created yet. Start by planning your first course!</p>
                    </div>
                  ) : (
                    courses.map((course) => (
                      <Card key={course.id} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedCourse(course.id);
                              setActiveTab('structure');
                            }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{course.title}</h4>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('chat-history');
                                }}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                View Planning Chat
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.status}</Badge>
                            <Badge variant="secondary">
                              {course.total_sessions || 10} sessions
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="planning">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">AI Course Planning</h2>
                    <p className="text-muted-foreground">
                      Collaborate with AI to design your course structure, learning objectives, and content flow.
                    </p>
                  </div>
                  <CoursePlanningChat onCoursePlanned={handleCoursePlanned} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="chat-history">
              <ChatHistoryView />
            </TabsContent>

            <TabsContent value="structure">
              <CourseStructureView courseId={selectedCourse || undefined} />
            </TabsContent>

            <TabsContent value="content">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content Generation</h3>
                <p className="text-muted-foreground">
                  Generate slides, assessments, and interactive content for your lectures.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Management</h3>
                <p className="text-muted-foreground">
                  Manage student accounts, progress tracking, and analytics.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}