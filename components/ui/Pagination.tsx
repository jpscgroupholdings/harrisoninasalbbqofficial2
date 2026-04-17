// components/ui/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { InputField } from "./InputField";
import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  showInfo?: boolean;
}

const getPaginationRange = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (currentPage >= totalPages - 3)
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export default function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showInfo = true,
}: PaginationProps) {
  const start = total && limit ? (currentPage - 1) * limit + 1 : null;
  const end = total && limit ? Math.min(currentPage * limit, total) : null;

  const limitOptions = [10, 20, 30, 40, 50];

  const [pageInput, setPageInput] = useState("");

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 border border-gray-200 shadow-sm rounded-xl p-4">
      {showInfo && start && end && total ? (
        <p className="text-sm text-stone-500">
          Showing {start}–{end} of {total} results
        </p>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-8">
        <div className="flex justify-between gap-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} className="text-brand-color-500"/>
          </button>
          {/* Pages */}
          {getPaginationRange(currentPage, totalPages).map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-stone-400 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? "bg-brand-color-500 text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
                }`}
              >
                {page}
              </button>
            ),
          )}
          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} className="text-brand-color-500" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-gray-200 px-2 py-2 rounded-lg cursor-pointer focus:outline-1 focus:outline-brand-color-600"
          >
            {limitOptions.map((limit, index) => (
              <option key={index} value={limit}>
                {limit}
              </option>
            ))}
          </select>
          <span>/ Page</span>
        </div>
      </div>

      <form
        onSubmit={() => {
          const page = Number(pageInput);
          if (page >= 1 && page <= totalPages) {
            onPageChange(page);
          }
        }}
        className="flex items-center gap-3"
      >
        <p className="whitespace-nowrap">Go To:</p>

        <InputField
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          className="py-2 px-1.5 w-24 text-center"
        />

        <button
          type="submit"
          className="px-3 py-2 bg-brand-color-500 hover:bg-brand-color-600 cursor-pointer text-white rounded-lg"
        >
          Go
        </button>
      </form>
    </div>
  );
}
