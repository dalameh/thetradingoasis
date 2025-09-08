"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search");

  const [input, setInput] = useState("");

  // Populate input on initial load only
  useEffect(() => {
    if (searchParam) {
      setInput(searchParam.toUpperCase());
    }
  }, [searchParam]); // run once on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Update URL without reload
    router.push(`?search=${encodeURIComponent(trimmed.toUpperCase())}`);

    // Clear the input for a fresh new search
    setInput("");
  };

  return (
    <div className="bg-gray-100 flex flex-col sm:flex-row justify-center w-full max-w-sm mx-auto p-2 rounded-lg mb-2">
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row w-full sm:space-x-2 space-y-2 sm:space-y-0"
      >
        <input
          type="text"
          placeholder="Enter ticker or company (eg. NVDA)"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          className="bg-white shadow-md text-black flex-grow min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
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
