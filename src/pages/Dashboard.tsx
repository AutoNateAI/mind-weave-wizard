import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/UI/GlassCard";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Settings, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAdminViewSwitch } from "@/hooks/useAdminViewSwitch";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AnalyticsDashboard } from "@/components/Analytics/AnalyticsDashboard";

export default function Dashboard() {
  const { isUnlocked, isCompleted, sessions, checkAdminStatus } = useProgress();
  const { isAdmin, isStudentView, isAdminView, toggleView } = useAdminViewSwitch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  console.log('🎯 Dashboard render:', { 
    isAdmin, 
    isStudentView,
    isAdminView,
    pathname: window.location.pathname
  });

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Fetch session data from database
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await supabase
          .from('sessions_dynamic')
          .select('*')
          .order('session_number');
        
        setSessionData(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  return (
    <>
      <PageMeta title="Thinking Wizard — Dashboard" description="Track progress and enter sessions." />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <main className="container py-10">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                  {showAnalytics ? "Analytics Dashboard" : "Modules"}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {showAnalytics ? "Track your learning progress and performance." : "Complete each module to unlock the next."}
                </p>
              </div>
              {isAdmin && (
                <Badge variant={isStudentView ? "secondary" : "default"} className="gap-2 text-xs">
                  {isStudentView ? <User className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                  {isStudentView ? "Student View" : "Admin View"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {isAdminView && (
                <Button variant="outline" asChild className="hover-scale">
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                    onClick={() => console.log('🚀 Admin Panel clicked - navigating to /admin')}
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Admin</span> Panel
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowAnalytics(!showAnalytics)}
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{showAnalytics ? 'Modules' : 'Analytics'}</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={toggleView}
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Switch to</span> {isStudentView ? "Admin" : "Student"}
                </Button>
              )}
              <Button variant="outline" asChild className="hover-scale">
                <Link to="/profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <ThemeToggle />
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-1 sm:gap-2 hover-scale text-xs sm:text-sm whitespace-nowrap">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>
      {showAnalytics ? (
        <AnalyticsDashboard />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <GlassCard key={idx + 1} className="p-5 animate-pulse">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-9 bg-muted rounded"></div>
              </GlassCard>
            ))
          ) : (
            Array.from({ length: 10 }).map((_, idx) => {
              const n = idx + 1;
              const locked = !isUnlocked(n);
              const complete = isCompleted(n);
              const sessionInfo = sessionData.find(s => s.session_number === n);
              
              return (
                <GlassCard key={n} className={`p-5 animate-fade-in hover-scale ${complete ? "ring-1 ring-primary cyber-glow" : "light-glow"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{sessionInfo?.title || sessionInfo?.theme || `Session ${n}`}</h2>
                    {complete && <span className="text-xs text-accent-foreground bg-accent/30 rounded px-2 py-1">Completed</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {locked ? "Locked" : `Module ${n}`}
                  </p>
                  <Button disabled={locked} onClick={() => navigate(`/session/${n}`)}>
                    {locked ? "Locked" : "Enter"}
                  </Button>
                </GlassCard>
              );
            })
          )}
        </section>
      )}
        </main>
      </div>
    </>
  );
}
