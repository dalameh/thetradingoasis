"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";


interface Star {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

function StarField() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Fewer stars on mobile
    const count = window.innerWidth < 768 ? 30 : 60;

    const generatedStars = Array.from({ length: count }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // 1–3px
      duration: Math.random() * 3 + 2, // 2–5s twinkle
      delay: Math.random() * 5, // random start offset
    }));

    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Stars (CSS animation, very cheap) */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function OasisLandingPage() {
  const router = useRouter();
  const handleSignIn = () => router.push("/signin");

  return (
    <main className="relative w-full h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a1b2d] to-[#10293f] text-white px-6">
      
      {/* Background stars */}
      <div className="absolute inset-0 pointer-events-none">
       <StarField />
      </div>

      {/* Shooting star (bottom-left → top-right, smooth) */}
      <motion.div
        className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_14px_rgba(255,255,255,0.9)]"
        initial={{ x: -800, y: 600, opacity: 0 }}
        animate={{
          x: [ -2100, 1200 ],
          y: [ 600, -400 ],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 3,       // slightly slower for smoothness
          repeat: Infinity,
          repeatDelay: 5,
          ease: "linear"
        }}
      >
        {/* Trail */}
        <motion.div
          className="absolute top-1/2 left-0 w-80 h-1 rounded-full origin-left"
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
            filter: "blur(3px)",
            transform: "rotate(165deg)" // aligned with diagonal
          }}
        />
      </motion.div>


      {/* Logo */}
      <motion.img
        src="/favicon.ico"
        alt="Trading Oasis Logo"
        className="w-28 h-28 drop-shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1.5 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />


      {/* Title */}
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold text-center tracking-wide leading-relaxed bg-clip-text text-transparent bg-gradient-to-r from-[#FFC857] via-[#FF6F3C] to-[#FF4E1C]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        The Trading Oasis
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-lg md:text-xl text-gray-300 max-w-xl text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Find clarity in the markets, like discovering water in the desert.  
        Refresh your trading journey with insight, balance, and flow.
      </motion.p>

      {/* Features */}
      <motion.ul
        className="mt-4 space-y-2 text-center text-xs tracking-wide md:text-base text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <li>🌴 Flow through market trends with clarity using charts and technical scans </li>
        <li>💧 Flow through headlines with refreshing sentiment insights</li>
        <li>☀️ Nurture your portfolio with watchlists and personalized tracking</li>
        <li>🏜️ Journal your trades with notes, checklists, and photo reflections</li>
      </motion.ul>

      {/* Sign-in button */}
      <motion.button
        onClick={handleSignIn}
        className="mt-10 px-10 py-3 rounded-full bg-gradient-to-r from-[#FF6F3C] to-[#FFC857] text-[#10293f] font-semibold shadow-lg hover:scale-105 transition-transform"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Enter the Oasis
      </motion.button>
    </main>
  );
}
