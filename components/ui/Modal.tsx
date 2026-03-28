"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  onClose: () => void;
  title: string;
  subTitle?: string;
  children: React.ReactNode;

  // optional extensibility (mentor tip 🔥)
  className?: string;
  contentClassName?: string;
}

export default function Modal({
  onClose,
  title,
  subTitle,
  children,
  className,
  contentClassName,
}: ModalProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-4",
        className
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full mx-auto max-w-3xl max-h-[90vh] overflow-y-auto hide-scrollbar"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-40"
          )}
        >
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <h4 className="text-sm text-slate-400">{subTitle}</h4>
          </div>

          <button
            onClick={onClose}
            className={cn(
              "p-2 hover:bg-slate-100 rounded-lg transition-colors"
            )}
          >
            <span className="text-xl text-slate-500">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className={cn("p-8",contentClassName)}>{children}</div>
      </div>
    </div>
  );
}