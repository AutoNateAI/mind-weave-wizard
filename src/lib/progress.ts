import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

type SessionProgress = {
  lecturesCompleted: number;
  gamesCompleted: number;
  reflectionsWritten: number;
  unlocked: boolean;
};

type StoreState = {
  sessions: Record<number, SessionProgress>;
  isAdmin: boolean;
  markLecture: (session: number) => void;
  markGame: (session: number) => void;
  markReflection: (session: number) => void;
  isUnlocked: (session: number) => boolean;
  isCompleted: (session: number) => boolean;
  checkAdminStatus: () => void;
};

const STORAGE_KEY = "tw_progress";

function loadInitial(): Record<number, SessionProgress> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const base: Record<number, SessionProgress> = {};
  for (let i = 1; i <= 10; i++) {
    base[i] = { lecturesCompleted: 0, gamesCompleted: 0, reflectionsWritten: 0, unlocked: true }; // All unlocked for now
  }
  return base;
}

function persist(sessions: Record<number, SessionProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export const useProgress = create<StoreState>((set, get) => ({
  sessions: loadInitial(),
  isAdmin: false,
  checkAdminStatus: async () => {
    const { data } = await supabase.auth.getUser();
    const isAdmin = data.user?.user_metadata?.role === "admin";
    set({ isAdmin });
    
    // If admin, unlock all sessions
    if (isAdmin) {
      const next = { ...get().sessions };
      for (let i = 1; i <= 10; i++) {
        next[i].unlocked = true;
      }
      persist(next);
      set({ sessions: next });
    }
  },
  markLecture: (session) => {
    const next = { ...get().sessions };
    next[session].lecturesCompleted = Math.min(3, next[session].lecturesCompleted + 1);
    if (!get().isAdmin) unlockIfComplete(next, session);
    persist(next);
    set({ sessions: next });
  },
  markGame: (session) => {
    const next = { ...get().sessions };
    next[session].gamesCompleted = Math.min(3, next[session].gamesCompleted + 1);
    if (!get().isAdmin) unlockIfComplete(next, session);
    persist(next);
    set({ sessions: next });
  },
  markReflection: (session) => {
    const next = { ...get().sessions };
    next[session].reflectionsWritten = Math.min(3, next[session].reflectionsWritten + 1);
    if (!get().isAdmin) unlockIfComplete(next, session);
    persist(next);
    set({ sessions: next });
  },
  isUnlocked: (session) => {
    if (get().isAdmin) return true;
    return get().sessions[session]?.unlocked ?? false;
  },
  isCompleted: (session) => {
    const s = get().sessions[session];
    return !!s && s.lecturesCompleted >= 3 && s.gamesCompleted >= 3 && s.reflectionsWritten >= 3;
  },
}));

function unlockIfComplete(next: Record<number, SessionProgress>, session: number) {
  const s = next[session];
  const complete = s.lecturesCompleted >= 3 && s.gamesCompleted >= 3 && s.reflectionsWritten >= 3;
  if (complete && session < 10) {
    next[session + 1].unlocked = true;
  }
}
