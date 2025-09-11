import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/NewsClient/SearchBar";
import NewsContentMain from "@/components/NewsClient/NewsContent";

export default function NewsPage() {
  return (
    <main>
      <PageHeader title="Market News" />
      <div className="min-h-screen p-8 pb-20">
        <SearchBar />
        <NewsContentMain />
      </div>
    </main>
  );
}

// 'use client'

// import React, { useEffect, useState } from "react";
// import NewsTable from "../../components/NewsTable";
// import PageHeader from '@/components/PageHeader'

// interface NewsItem {
//   title: string;
//   description: string;
//   date: string;
//   source: string;
//   url: string;
// }

// export default function NewsPage() {    
//   const [news, setNews] = useState<NewsItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [input, setInput] = useState(""); // controlled input
//   const [companyName, setCompanyName] = useState("S&P 500"); // controlled input
//   const [query, setQuery] = useState("S&P 500"); // actual query used to fetch news

//   useEffect(() => {
//     if (!query) return;

//     setLoading(true);
//     fetch(`/api/news?company=${encodeURIComponent(query + " stock")}`)
//       .then(res => res.json())
//       .then(data => {
//         if (data.error) {
//           setError(data.error);
//           setNews([]);
//         } else {
//           setNews(data.news || []);
//           setError(null);
//         }
//         setLoading(false);
//       })
//       .catch(e => {
//         setError(e.message);
//         setLoading(false);
//         setNews([]);
//       });
//   }, [query]);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault(); // prevent page reload
//     if (input.trim()) {
//       setCompanyName(input)
//       setQuery(input.trim());
//       setInput("")
//     }
//   };

//   return (
//     <main>
//       <PageHeader title="Headline News"/>
//       <div className="bg-gray-100 min-h-screen p-8 pb-20 bg-gray-50">
//         <div className="bg-gray-100 flex flex-col sm:flex-row justify-center mb-3 w-full max-w-md mx-auto p-2 rounded-lg">
//           <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full sm:space-x-2 space-y-2 sm:space-y-0">

//             <input
//               id="companyInput"
//               type="text"
//               placeholder="Enter ticker or company (eg. NVDA)"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               className="bg-white shadow-md text-black flex-grow min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               autoComplete="off"
//             />
//             <button
//               type="submit"
//               disabled={!companyName.trim()}
//                 className="px-4 py-2 bg-blue-600 shadow-md text-white rounded-lg hover:bg-blue-700"
//               aria-disabled={!companyName.trim()}
//             >
//               Search
//             </button>
//           </form>
//         </div>

//         <header className="flex text-black font-bold justify-center mb-5 space-x-2 mt-3">{companyName}</header>

//         {loading && 
//         <div className="relative overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white max-w-5xl mx-auto">
//           <table className="w-full border-collapse text-xs table-fixed">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">
//                     Source
//                   </th>
//                   <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">
//                     Date
//                   </th>
//                   <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-2/6">
//                     Title
//                   </th>
//                   {/* <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-2/6">
//                     Description
//                   </th> */}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...Array(5)].map((_, i) => (
//                   <tr key={i} className="border-t border-gray-200">
//                     <td className="px-4 py-4 whitespace-nowrap">
//                       <div className="h-4 bg-gray-300 rounded w-16"></div>
//                     </td>
//                     <td className="px-4 py-4 whitespace-nowrap">
//                       <div className="h-4 bg-gray-300 rounded w-20"></div>
//                     </td>
//                     <td className="px-4 py-4 whitespace-nowrap">
//                       <div className="h-4 bg-gray-300 rounded w-40"></div>
//                     </td>
//                     {/* <td className="px-4 py-4 whitespace-nowrap">
//                       <div className="h-4 bg-gray-300 rounded w-60"></div>
//                     </td> */}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         }

//         {error && <p className="text-red-600">Error: {error}</p>}
//         {!loading && !error && news.length === 0 && query && (
//           <p className = "text-black" >No news found for {query}.</p>
//         )}
//         {!loading && news.length > 0 && 
//             <NewsTable news={news} rpp = {5} />
//         }
//       </div>
//     </main>
//   );
// }
