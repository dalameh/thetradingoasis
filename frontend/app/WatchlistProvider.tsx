'use client';

import { useEffect, useRef } from 'react';
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

  // Track whether current WS is for guest or real user
  const isGuestRef = useRef<boolean | null>(null);

  // 1️⃣ Fetch Supabase auth user or guest on mount
  useEffect(() => {
    const fetchUserOrGuest = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        // Real user
        setUserId(data.user.id);
        isGuestRef.current = false;
      } else {
        // Guest fallback
        const isGuest = sessionStorage.getItem("authenticated") === "guest";
        const gid = sessionStorage.getItem("guestId");
        if (isGuest && gid) {
          setUserId(gid);
          isGuestRef.current = true;
        }
      }
    };

    fetchUserOrGuest();
  }, [setUserId]);

  // 2️⃣ Initialize WS whenever userId changes (guest or real)
  useEffect(() => {
    if (!userId) return;

    const setupWS = async () => {
      // If WS exists and type changed (guest → real), clear WS first
      if (wsManager) {
        clearWS();
      }

      await initWS();
      await loadWatchlist();
    };

    setupWS();
  }, [userId]); // removed wsManager from deps so effect runs whenever userId changes

  // 3️⃣ Listen for Supabase auth changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        clearWS();
        setUserId(null);
        setWatchlist([]);
        isGuestRef.current = null;
      }

      if (event === 'SIGNED_IN') {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const prevGuest = isGuestRef.current;
          setUserId(data.user.id);
          isGuestRef.current = false;

          // If coming from guest, clear WS first
          if (prevGuest) {
            clearWS();
          }
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [clearWS, setUserId, setWatchlist]);

  // 4️⃣ Cleanup WS on browser/tab close
  useEffect(() => {
    const handleUnload = () => clearWS();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [clearWS]);

  return <>{children}</>;
}


// 'use client';

// import { useEffect } from 'react';
// import { useWatchlistStore } from '@/store/WatchlistStore';
// import { supabase } from '@/lib/supabaseFrontendClient';

// export default function WatchlistProvider({ children }: { children: React.ReactNode }) {
//   const {
//     userId,
//     setUserId,
//     wsManager,
//     initWS,
//     loadWatchlist,
//     clearWS,
//     setWatchlist,
//   } = useWatchlistStore();

//   // 1️⃣ Fetch current user
//   const fetchUser = async () => {
//     const { data } = await supabase.auth.getUser();
//     if (data.user) setUserId(data.user.id);
//   };

//   useEffect(() => {
//     fetchUser();
//   }, [fetch, setUserId]);

//   // 2️⃣ Initialize WS when userId exists
//   useEffect(() => {
//     if (!userId || wsManager) return;

//     const setupWS = async () => {
//       await initWS();
//       await loadWatchlist();
//     };

//     setupWS();
//   }, [userId, wsManager, initWS, loadWatchlist]);

//   // 3️⃣ Listen for auth changes (sign-in, sign-out)
//   useEffect(() => {
//     const { data: listener } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_OUT') {
//         clearWS();          // close WS
//         setUserId(null);    // clear user ID
//         setWatchlist([]);   // clear watchlist
//       }

//       if (event === 'SIGNED_IN') {
//         fetchUser();        // re-fetch user ID
//       }
//     });

//     return () => listener.subscription.unsubscribe();
//   }, [clearWS, setUserId, setWatchlist]);

//   // 4️⃣ Cleanup WS on component unmount + browser/tab close
//   useEffect(() => {
//     const handleUnload = () => {
//       clearWS();
//     };

//     window.addEventListener('beforeunload', handleUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleUnload);
//       clearWS(); // cleanup on React unmount
//     };
//   }, [clearWS]);

//   return <>{children}</>;
// }