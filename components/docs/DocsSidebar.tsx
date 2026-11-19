"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Search,
  X,
  ChevronRight,
  Layers,
} from "lucide-react";

export interface DocPageItem {
  id: string;
  title: string;
  icon?: string;
  content: unknown;
}

interface DocsSidebarProps {
  documentTitle: string;
  documentIcon?: string;
  pages: DocPageItem[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: (title?: string) => void;
  onRenamePage: (pageId: string, newTitle: string) => void;
  onDeletePage: (pageId: string) => void;
  onBackToList: () => void;
}

export function DocsSidebar({
  documentTitle,
  documentIcon = "📄",
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onBackToList,
}: DocsSidebarProps) {
  const [search, setSearch] = useState("");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const startRename = (page: DocPageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPageId(page.id);
    setEditTitle(page.title);
  };

  const saveRename = (pageId: string) => {
    if (editTitle.trim()) {
      onRenamePage(pageId, editTitle.trim());
    }
    setEditingPageId(null);
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex select-none">
      {/* 1. Header with Back button and Document Title */}
      <div className="border-b border-border p-3.5">
        <button
          type="button"
          onClick={onBackToList}
          className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Documents</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-base dark:bg-violet-950/50">
            {documentIcon || "📄"}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-foreground" title={documentTitle}>
              {documentTitle || "Untitled document"}
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Document</span>
              <span>·</span>
              <span>{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pages Section Header & Add Page button */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span>Pages</span>
          <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-medium text-foreground">
            {pages.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddPage()}
          className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
          title="Add page"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add page</span>
        </button>
      </div>

      {/* 3. Search pages if > 3 */}
      {pages.length > 3 && (
        <div className="m-3 my-1.5 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Search pages..."
          />
          {search && (
            <button onClick={() => setSearch("")} className="hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* 4. Pages list */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        <div className="flex flex-col gap-0.5">
          {filteredPages.map((page, index) => {
            const isActive = page.id === activePageId;
            const isEditing = editingPageId === page.id;

            return (
              <div
                key={page.id}
                onClick={() => !isEditing && onSelectPage(page.id)}
                className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "bg-violet-50 font-bold text-violet-800 shadow-2xs dark:bg-violet-950/40 dark:text-violet-200"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground font-medium"
                }`}
              >
                {/* Left Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary" />
                )}

                <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                  <FileText
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />

                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(page.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(page.id);
                        if (e.key === "Escape") setEditingPageId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border border-primary px-1.5 py-0.5 text-xs font-semibold text-slate-800 outline-none w-full dark:bg-card dark:text-foreground"
                    />
                  ) : (
                    <span className="truncate min-w-0 flex-1">
                      {page.title || `Page ${index + 1}`}
                    </span>
                  )}
                </div>

                {/* Right Actions */}
                {!isEditing && (
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => startRename(page, e)}
                      title="Rename page"
                      className="rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-muted dark:hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>

                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        title="Delete page"
                        className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom "+ Add page" shortcut button */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => onAddPage()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2 text-xs font-bold text-primary hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer dark:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add page</span>
        </button>
      </div>
    </aside>
  );
}
