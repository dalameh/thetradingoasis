"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tickerParam = searchParams.get("ticker");

  const [input, setInput] = useState("");

  // Populate input on initial load only
  useEffect(() => {
    if (tickerParam) {
      setInput(tickerParam.toUpperCase());
    }
  }, [tickerParam]); // run once on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Update URL without reload
    router.push(`?ticker=${encodeURIComponent(trimmed.toUpperCase())}`);

    // Clear the input for a fresh new search
    setInput("");
  };

  return (
    <div className="bg-gray-100 flex justify-center mb-3 w-full max-w-sm mx-auto p-2 rounded-lg">
      <form onSubmit={handleSearch} className="flex w-full space-x-2">
        <input
          type="text"
          placeholder="Enter ticker or index (eg. AAPL)"
          value={input}
          onChange={(e) => setInput(e.target.value)} // preserve typed input
          className="bg-white text-black shadow-md flex-grow min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg"
          >
            <Search className="w-5 h-5 text-white" />
            {/* Search */}
          </button>
        </div>
      </form>
    </div>
  );
}
