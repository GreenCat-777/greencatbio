"use client";

import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

export type Profile = { id: string; username: string; avatar_url: string | null; verified: boolean };
// "needs-username" kept only as a safety fallback for any old profile-less accounts;
// normal signup now creates username + profile atomically server-side.
export type AccountState = "loading" | "signed-out" | "needs-username" | "ready";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export function useAccount() {
  const [state, setState] = useState<AccountState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabaseBrowser
      .from("profiles")
      .select("id, username, avatar_url, verified")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load profile:", error);
      return null;
    }
    return data as Profile | null;
  }, []);

  const refresh = useCallback(
    async (sess: Session | null) => {
      setSession(sess);
      if (!sess) {
        setProfile(null);
        setState("signed-out");
        return;
      }
      try {
        const p = await withTimeout(loadProfile(sess.user.id), 8000);
        if (!p) {
          setState("needs-username");
        } else {
          setProfile(p);
          setState("ready");
        }
      } catch (err) {
        // Never leave the UI stuck on "loading" — fail safe to signed-out
        // so the person can just try signing in again.
        console.error("Account refresh failed or timed out:", err);
        setProfile(null);
        setState("signed-out");
      }
    },
    [loadProfile]
  );

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => refresh(data.session));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, sess) => refresh(sess));
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  async function completeUsername(username: string) {
    if (!session) throw new Error("Not signed in.");
    const { error } = await supabaseBrowser
      .from("profiles")
      .insert([{ id: session.user.id, username, verified: false }]);
    if (error) throw error;
    setProfile({ id: session.user.id, username, avatar_url: null, verified: false });
    setState("ready");
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
  }

  async function refreshProfile() {
    if (!session) return;
    const p = await loadProfile(session.user.id);
    if (p) setProfile(p);
  }

  return { state, session, profile, completeUsername, signOut, refreshProfile };
}
