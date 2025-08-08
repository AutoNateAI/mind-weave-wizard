import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { GlassCard } from "@/components/UI/GlassCard";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { isUnlocked, isCompleted, sessions, checkAdminStatus } = useProgress();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <main className="container py-10">
      <PageMeta title="Thinking Wizard — Dashboard" description="Track progress and enter sessions." />
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Session Dashboard</h1>
          <p className="text-muted-foreground">Complete each session to unlock the next.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 10 }).map((_, idx) => {
          const n = idx + 1;
          const locked = !isUnlocked(n);
          const complete = isCompleted(n);
          return (
            <GlassCard key={n} className={`p-5 animate-enter ${complete ? "ring-1 ring-primary" : ""}`}>
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
  );
}
