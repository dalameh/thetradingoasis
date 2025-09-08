'use client';

import { useEffect } from 'react';
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

  // 1️⃣ Fetch current user
  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUserId(data.user.id);
  };

  useEffect(() => {
    fetchUser();
  }, [setUserId]);

  // 2️⃣ Initialize WS when userId exists
  useEffect(() => {
    if (!userId || wsManager) return;

    const setupWS = async () => {
      await initWS();
      await loadWatchlist();
    };

    setupWS();
  }, [userId, wsManager, initWS, loadWatchlist]);

  // 3️⃣ Listen for auth changes (sign-in, sign-out)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearWS();          // close WS
        setUserId(null);    // clear user ID
        setWatchlist([]);   // clear watchlist
      }

      if (event === 'SIGNED_IN') {
        fetchUser();        // re-fetch user ID
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [clearWS, setUserId, setWatchlist]);

  // 4️⃣ Cleanup WS on component unmount + browser/tab close
  useEffect(() => {
    const handleUnload = () => {
      clearWS();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearWS(); // cleanup on React unmount
    };
  }, [clearWS]);

  return <>{children}</>;
}