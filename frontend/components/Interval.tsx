'use client';

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
const intervals = ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"] as const;
type Interval = typeof intervals[number];

export default function IntervalSelector({
  selectedInterval,
  setSelectedInterval,
}: {
  selectedInterval: Interval;
  setSelectedInterval: (val: Interval) => void;
}) {
  const [open, setOpen] = useState(false);

  const containerVariants : Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.01, // faster stagger (20ms)
    },
  },
};

const buttonVariants : Variants= {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "tween", duration: 0.1, ease: "easeOut" }, // faster tween
  },
};


  return (
<div className="flex items-center gap-2 relative w-full">
      <label className="text-black text-md font-semibold whitespace-nowrap">
        Interval:
      </label>

    <button
    className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-100 flex items-center"
        onClick={() => setOpen((prev) => !prev)}
        >
        {selectedInterval} <span className="font-bold text-gray-600">&gt; </span>      
    </button>

      <AnimatePresence>
        {open && (
          <motion.div
        className="flex gap-2 overflow-x-auto max-w-full p-2 rounded bg-white"
            style={{ marginLeft: "10px" }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {intervals.map((interval) => (
              <motion.button
                key={interval}
                onClick={() => {
                  setSelectedInterval(interval);
                  setOpen(false);
                }}
            className="px-4 py-1 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-800 text-sm font-medium shadow-md border border-gray-300 flex-shrink-0 transition-colors duration-200"
                variants={buttonVariants}
              >
                {interval}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}