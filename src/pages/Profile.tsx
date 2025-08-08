import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PageMeta } from "@/components/UI/PageMeta";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { GlassCard } from "@/components/UI/GlassCard";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.display_name || "");
      setBio(user.user_metadata.bio || "");
    }
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio: bio
      }
    });

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setLoading(false);
  };

  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <main className="container py-10 max-w-2xl">
      <PageMeta title="Thinking Wizard — Profile" description="Manage your profile and account settings" />
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="w-8 h-8" />
            Profile
          </h1>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </header>

        <GlassCard className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {isAdmin && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Administrator Account
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You have full access to all sessions and features.
              </p>
            </div>
          )}

          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-2">Account Information</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</p>
            <p>Role: {isAdmin ? "Administrator" : "Student"}</p>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}