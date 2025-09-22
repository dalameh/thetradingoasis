"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

function SearchContent() {
  const router = useRouter();
  const [input, setInput] = useState("");

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
    <div className="bg-gray-100 flex justify-center mb-1 w-full max-w-sm mx-auto p-2 rounded-lg">
      <form
        onSubmit={handleSearch}
        className="flex w-full space-x-2"
      >
        <input
          type="text"
          placeholder="Enter ticker or company (eg. NVDA)"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          className="
              bg-white text-black
              text-sm sm:text-md
              placeholder:text-sm sm:placeholder:text-md
              shadow-md flex-grow min-w-0 px-4 py-2
              border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "          
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

export default function SearchBar() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
