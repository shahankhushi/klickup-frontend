"use client";

import {
  Star,
  Share2,
  MessageSquare,
  MoreHorizontal,
  Maximize2,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface WhiteboardHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveStatus: "saved" | "saving" | "error";
  onShare: () => void;
  onOpenManager?: () => void;
  whiteboardCount?: number;
  onBackToList?: () => void;
}

export function WhiteboardHeader({
  title,
  onTitleChange,
  saveStatus,
  onShare,
  onOpenManager,
  whiteboardCount = 1,
  onBackToList,
}: WhiteboardHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [starred, setStarred] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="h-12 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs flex items-center justify-between px-4 z-30 select-none">
      {/* Left: Whiteboard Title & Star */}
      <div className="flex items-center gap-2">
        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors mr-1 border border-slate-200 shadow-2xs cursor-pointer"
            title="Back to Whiteboards List"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        )}

        {/* Folded page / whiteboard icon */}
        <span className="grid h-6 w-6 place-items-center rounded bg-amber-500/10 text-amber-600">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </span>

        {editingTitle ? (
          <input
            autoFocus
            type="text"
            defaultValue={title}
            onBlur={(e) => {
              if (e.target.value.trim()) onTitleChange(e.target.value.trim());
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.currentTarget.value.trim()) onTitleChange(e.currentTarget.value.trim());
                setEditingTitle(false);
              }
            }}
            className="text-sm font-semibold text-slate-800 border-b border-primary outline-none px-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold text-slate-800 hover:text-primary transition-colors truncate max-w-xs"
            title="Click to rename"
          >
            {title}
          </button>
        )}

        {/* Whiteboards Manager / Switcher dropdown trigger */}
        {onOpenManager && (
          <button
            type="button"
            onClick={onOpenManager}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs font-semibold"
            title="Switch or create whiteboards"
          >
            <span className="text-[10.5px] bg-slate-100 px-1 rounded text-slate-600">{whiteboardCount}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setStarred(!starred)}
          className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
          title={starred ? "Unstar" : "Star"}
        >
          <Star className={`h-3.5 w-3.5 ${starred ? "fill-amber-500 text-amber-500" : ""}`} />
        </button>

        {/* Save Status / Auto-saved draft */}
        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium ml-2 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full">
          {saveStatus === "saving" ? (
            <span className="italic text-amber-600">Saving draft...</span>
          ) : saveStatus === "saved" ? (
            <>
              <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700 font-semibold">Draft Saved</span>
            </>
          ) : (
            <span className="text-red-500">Save failed</span>
          )}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* User initials circle */}
        <span className="grid h-7 w-7 place-items-center rounded-full bg-purple-700 text-[10px] font-bold text-white shadow-2xs">
          TA
        </span>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5 text-slate-500" />
          <span>Share</span>
        </button>

        {/* Comments */}
        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Comments"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* More */}
        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={toggleFullScreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Close / Return to Tasks */}
        <Link
          href="/tasks"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close whiteboard"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
