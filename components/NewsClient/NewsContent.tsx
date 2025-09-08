'use client';

import React from 'react';

export default function NewsContent() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Blank Page</h1>
        <p className="text-gray-600">This is a blank page skeleton. Start building your content here.</p>
      </div>
    </main>
  );
}

// "use client";

// import React, { ReactNode, ErrorInfo, Suspense, useEffect, useRef, useState } from "react";
// import dynamic from "next/dynamic";
// import { useSearchParams } from "next/navigation";

// // --- Dynamic NewsTable ---
// const NewsTable = dynamic(() => import("@/components/NewsClient/NewsTable"), { ssr: false });

// // --- Lazy-loaded SentimentIsland ---
// const SentimentIsland = dynamic(
//   () => import("@/components/NewsClient/SentimentIsland"),
//   { ssr: false }
// );

// interface ErrorBoundaryProps {
//   fallback?: ReactNode;
//   children: ReactNode;
// }

// interface ErrorBoundaryState {
//   hasError: boolean;
// }

// export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
//   state: ErrorBoundaryState = { hasError: false };

//   static getDerivedStateFromError(_: Error): ErrorBoundaryState {
//     return { hasError: true };
//   }

//   componentDidUpdate(prevProps: ErrorBoundaryProps) {
//     if (prevProps.children !== this.props.children && this.state.hasError) {
//       this.setState({ hasError: false });
//     }
//   }

//   componentDidCatch(error: Error, info: ErrorInfo) {
//     console.error("ErrorBoundary caught an error:", error, info);
//   }

//   render() {
//     return this.state.hasError
//       ? this.props.fallback ?? <div>Something went wrong.</div>
//       : this.props.children;
//   }
// }

// interface NewsItem {
//   title: string;
//   description: string;
//   date: string;
//   source: string;
//   url: string;
// }

// export default function NewsContent() {
//   const searchParams = useSearchParams();
//   const tickerParam = searchParams.get("search");

//   // --- State ---
//   const [currentSearch, setCurrentSearch] = useState("S&P 500");
//   const [searchForFetch, setSearchForFetch] = useState("S&P 500");
//   const [news, setNews] = useState<NewsItem[]>([]);
//   const [headlines, setHeadlines] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const newsControllerRef = useRef<AbortController | null>(null);
//   const isMountedRef = useRef(true);

//   // --- Track mounted state ---
//   useEffect(() => {
//     isMountedRef.current = true;
//     return () => {
//       isMountedRef.current = false;
//       newsControllerRef.current?.abort();
//     };
//   }, []);

//   // --- Update displayed search instantly ---
//   useEffect(() => {
//     const newSearch = tickerParam || "S&P 500";
//     setCurrentSearch(newSearch);
//     setNews([]);
//     setHeadlines([]);
//     setLoading(true);
//     setSearchForFetch(newSearch); // trigger fetch
//   }, [tickerParam]);

//   // --- Fetch news with instant-leave ---
//   useEffect(() => {
//     if (!searchForFetch || !isMountedRef.current) return;

//     newsControllerRef.current?.abort();
//     const controller = new AbortController();
//     newsControllerRef.current = controller;
//     let cancelled = false;

//     (async () => {
//       try {
//         const res = await fetch(`/api/news?company=${encodeURIComponent(searchForFetch + " stock")}`, { signal: controller.signal });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         if (cancelled || !isMountedRef.current) return;

//         if (data.error) {
//           setError(data.error);
//           setNews([]);
//           setHeadlines([]);
//         } else {
//           const newsItems: NewsItem[] = data.news || [];
//           setNews(newsItems);
//           setHeadlines(newsItems.map((n) => n.title));
//           setError(null);
//         }
//         setLoading(false);
//      } catch (err: unknown) {
//           if (err instanceof DOMException && err.name === "AbortError") return;

//           const errorMessage =
//             err instanceof Error ? err.message : "Failed to fetch news";

//           if (cancelled) return;

//           setError(errorMessage);
//           setNews([]);
//           setHeadlines([]);
//           setLoading(false);
//         }
//      })();

//     return () => {
//       cancelled = true;
//       controller.abort();
//     };
//   }, [searchForFetch]);

//   return (
//     <div className="max-w-6xl mt-3 mx-auto">
//       <h2 className="text-1xl font-bold text-gray-900 text-center">{currentSearch}</h2>

//       <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
//         <div className="bg-gray-100 rounded-xl p-6 flex flex-col justify-center">
//           <h3 className="text-base font-semibold text-black mb-4 text-center">Sentiment Overview</h3>
//           <Suspense fallback={<div className="h-72 flex items-center justify-center animate-pulse bg-gray-100 rounded-xl" />}>
//             <ErrorBoundary fallback={<div className="h-72 text-red-600 text-center">Could not load sentiment.</div>}>
//               <SentimentIsland headlines={headlines} />
//             </ErrorBoundary>
//           </Suspense>
//         </div>

//         {/* --- News Table */}
//         <div className="lg:col-span-1 p-4">
//           {loading ? (
//             <div>
//               <div className="flex justify-center items-center gap-3 mb-2">
//                 <button className="w-10 h-10 rounded-full border border-gray-400 bg-gray-200 opacity-40 cursor-not-allowed">&lsaquo;</button>
//                 <button className="w-10 h-10 rounded-full border border-gray-400 bg-gray-200 opacity-40 cursor-not-allowed">&rsaquo;</button>
//               </div>
//               <div className="relative overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white max-w-5xl mx-auto">
//                 <table className="w-full border-collapse text-xs table-fixed">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">Source</th>
//                       <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">Date</th>
//                       <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-2/6">Title</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {[...Array(5)].map((_, i) => (
//                       <tr key={i} className="border-t border-gray-200">
//                         <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-16" /></td>
//                         <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-20" /></td>
//                         <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-300 rounded w-40" /></td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ) : error ? (
//             <p className="text-red-600 text-center">Error: {error}</p>
//           ) : news.length === 0 ? (
//             <p className="text-gray-700 text-center">No news found for {currentSearch}.</p>
//           ) : (
//             <NewsTable news={news} rpp={5} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }