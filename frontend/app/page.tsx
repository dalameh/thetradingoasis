"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function StarField() {
  const [stars, setStars] = useState<{top: string, left: string, width: number, height: number, opacity: number}[]>([]);
  useEffect(() => {
      // lock scrolling
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        // restore when leaving this page
        document.body.style.overflow = prev;
      };
    }, []);

  useEffect(() => {
    const generatedStars = Array.from({ length: 200 }).map(() => ({
      width: Math.random() * 2 + 0.5,
      height: Math.random() * 2 + 0.5,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.5 + 0.5,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: star.width,
            height: star.height,
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            filter: "blur(0.5px)",
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}


export default function OasisLandingPage() {
  const router = useRouter();
  const handleSignIn = () => router.push("/signin");

  return (
    <main className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden  bg-gradient-to-b from-[#0a1b2d] to-[#10293f] text-white px-6">
      
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
        className="mt-4 space-y-2 text-sm md:text-base text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <li>🌴 Visualize trades in a serene, clear interface</li>
        <li>💧 Track your portfolio with refreshing precision</li>
        <li>☀️ Daily market insights to guide your journey</li>
        <li>🏜️ A calm place to reflect on strategies</li>
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
