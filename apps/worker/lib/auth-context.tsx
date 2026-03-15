import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { apiGet } from "./api";
import type { Session } from "@supabase/supabase-js";

interface WorkerProfile {
  verificationStatus: string;
  residencyStatus: string | null;
  contractorAgreed: boolean;
  rating: number;
  shiftsCount: number;
  totalEarned: number;
  showRate: number;
  isAvailable: boolean;
  skills: Array<{ skill: { name: string }; verified: boolean }>;
}

interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  profile: WorkerProfile;
}

interface AuthState {
  session: Session | null;
  user: UserData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    const { data, error } = await apiGet<UserData>("/workers/me");
    if (!error && data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }

  async function refreshProfile() {
    await fetchProfile();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s) {
          fetchProfile();
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
