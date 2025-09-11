import React, { useState } from 'react';
import Pagination from "@/components/Pagination"
interface NewsItem {
  title: string;
  description: string;
  date: string;
  source: string;
  url: string;
}

interface NewsTableProps {
  news: NewsItem[];
  rpp: number;
}

export default function NewsTable({ news, rpp }: NewsTableProps) {
  const rowsPerPage = rpp;
  const [page, setPage] = useState(0);

  // Filter to only last 24 hours
  const now = new Date();
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;

  const filteredNews = news.filter(item => {
    const itemTime = new Date(item.date).getTime();
    return itemTime >= oneDayAgo;
  });

  // Sort newest first
  const sortedNews = filteredNews.slice().sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalPages = Math.ceil(sortedNews.length / rowsPerPage);
  const pageData = sortedNews.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <div className="overflow-x-visible">
       {totalPages >= 1 && (
          <Pagination totalPages={totalPages} page={page} setPage={setPage} maxButtons={3} />
      )}
        <div className="relative overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white max-w-5xl mx-auto">
          <table className="w-full border-collapse text-xs table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-center sm-text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">
                Source
              </th>
              <th className="px-4 py-4 text-center sm:text-left font-semibold text-gray-700 uppercase tracking-wider w-1/6">
                Date
              </th>
              <th className="px-4 py-4 text-center font-semibold text-gray-700 uppercase tracking-wider w-2/6">
                Title
              </th>
              {/* <th className="px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider w-2/6">
                Description
              </th> */}
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-100 transition-colors duration-200 border text-[0.65rem]">
                  <td className="px-4 py-2.5 break-words text-gray-800 font-medium">
                    {item.source}
                  </td>
                  <td className="px-4 py-2.5 break-words text-gray-600">
                    {new Date(item.date).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 break-words text-blue-600 font-semibold">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.title}
                    </a>
                  </td>
                  {/* <td className="px-4 py-1 text-gray-700 whitespace-normal">
                    {item.description}
                  </td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                  No news available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}