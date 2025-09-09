'use client';

import { useEffect, useCallback } from 'react';
import { useWatchlistStore } from '@/store/WatchlistStore';
import { supabase } from '@/lib/supabaseFrontendClient';

export default function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const {
    userId,
    setUserId,
    wsManager,
    initWS,
    loadWatchlist,
    clearWS,
    setWatchlist,
  } = useWatchlistStore();

  // 1️⃣ Stable fetchUser
  const fetchUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUserId(data.user.id);
  }, [setUserId]);

  // 2️⃣ Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 3️⃣ Initialize WS when userId exists
  useEffect(() => {
    if (!userId || wsManager) return;

    let active = true;

    const setupWS = async () => {
      await initWS();
      if (active) {
        await loadWatchlist();
      }
    };

    setupWS();

    return () => {
      active = false;
    };
  }, [userId, wsManager, initWS, loadWatchlist]);

  // 4️⃣ Listen for auth changes (sign-in, sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      clearWS();
      setUserId(null);
      setWatchlist([]);
    }

    if (event === 'SIGNED_IN') {
      fetchUser();
    }
  });

  return () => {
    subscription.unsubscribe();
  };

  }, [clearWS, setUserId, setWatchlist, fetchUser]);

  // 5️⃣ Cleanup WS on unmount + browser/tab close
  useEffect(() => {
    const handleUnload = () => clearWS();

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearWS();
    };
  }, [clearWS]);

  return <>{children}</>;
}