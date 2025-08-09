import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 useAuth: Setting up auth listeners');
    
    // Set listener first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('🔐 useAuth: Auth state changed', { event, user: s?.user?.email, hasSession: !!s });
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Then get existing session
    supabase.auth.getSession().then(({ data }) => {
      console.log('🔐 useAuth: Initial session check', { user: data.session?.user?.email, hasSession: !!data.session });
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
