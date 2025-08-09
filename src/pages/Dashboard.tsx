import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { GlassCard } from "@/components/UI/GlassCard";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAdminViewSwitch } from "@/hooks/useAdminViewSwitch";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export default function Dashboard() {
  const { isUnlocked, isCompleted, sessions, checkAdminStatus } = useProgress();
  const { isAdmin, isStudentView, isAdminView, toggleView } = useAdminViewSwitch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Session Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Complete each session to unlock the next.</p>
              </div>
              {isAdmin && (
                <Badge variant={isStudentView ? "secondary" : "default"} className="gap-2 text-xs">
                  {isStudentView ? <User className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                  {isStudentView ? "Student View" : "Admin View"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <ThemeToggle />
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
              {isAdminView && (
                <Button variant="outline" asChild className="hover-scale">
                  <Link to="/admin" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Admin</span> Panel
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild className="hover-scale">
                <Link to="/profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-1 sm:gap-2 hover-scale text-xs sm:text-sm whitespace-nowrap">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 10 }).map((_, idx) => {
          const n = idx + 1;
          const locked = !isUnlocked(n);
          const complete = isCompleted(n);
          return (
            <GlassCard key={n} className={`p-5 animate-fade-in hover-scale ${complete ? "ring-1 ring-primary cyber-glow" : "light-glow"}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Session {n}</h2>
                {complete && <span className="text-xs text-accent-foreground bg-accent/30 rounded px-2 py-1">Completed</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{locked ? "Locked" : "Ready"}</p>
              <Button disabled={locked} onClick={() => navigate(`/session/${n}`)}>
                {locked ? "Locked" : "Enter"}
              </Button>
            </GlassCard>
          );
        })}
          </section>
        </main>
      </div>
    </>
  );
}
