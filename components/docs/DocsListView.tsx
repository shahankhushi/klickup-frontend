"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Columns3,
  Layers,
  ChevronDown,
  Star,
  FileText,
  Trash2,
  Copy,
  Edit2,
  ArrowRight,
} from "lucide-react";

export interface DocItem {
  id: string;
  title: string;
  icon?: string;
  content: string;
  visibility?: "private" | "workspace" | "department" | "project";
  isPinned?: boolean;
  isFavorite?: boolean;
  updatedAt: string;
}

interface DocsListViewProps {
  docs: DocItem[];
  onOpenDoc: (docId: string) => void;
  onCreateNewDoc: (title?: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
}

export function DocsListView({
  docs,
  onOpenDoc,
  onCreateNewDoc,
  onRenameDoc,
  onDeleteDoc,
  onDuplicateDoc,
}: DocsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [starred, setStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "board">("list");
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");

  const filteredDocs = docs.filter((d) =>
    (d.title || "Untitled document").toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const getPagesCount = (contentStr: string) => {
    try {
      const parsed = typeof contentStr === "string" ? JSON.parse(contentStr) : contentStr;
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as { pages?: unknown[] }).pages)) {
        return (parsed as { pages: unknown[] }).pages.length || 1;
      }
      return 1;
    } catch {
      return 1;
    }
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineTitle.trim()) {
      onCreateNewDoc(inlineTitle.trim());
      setInlineTitle("");
      setIsAddingInline(false);
    }
  };

  const handleStartRename = (d: DocItem) => {
    setEditingId(d.id);
    setEditTitleValue(d.title || "Untitled document");
  };

  const handleSaveRename = (id: string) => {
    if (editTitleValue.trim()) {
      onRenameDoc(id, editTitleValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-white overflow-y-auto select-none dark:bg-card">
      {/* 1. ClickUp Top Breadcrumb Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-2.5 dark:border-border">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
          <span className="grid h-5 w-5 place-items-center rounded bg-amber-500 text-[10px] font-bold text-white shadow-xs">
            P
          </span>
          <span className="font-medium text-slate-700 dark:text-foreground">Performance Department</span>
          <span className="text-slate-400">/</span>
          <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>Docs</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => setStarred(!starred)}
            className="text-slate-400 hover:text-amber-500 transition-colors ml-1"
          >
            <Star className={`h-4 w-4 ${starred ? "fill-amber-400 text-amber-500" : ""}`} />
          </button>
        </div>

        {/* Top-Right Quick Action Button */}
        <button
          type="button"
          onClick={() => onCreateNewDoc(`Untitled document ${docs.length + 1}`)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Doc</span>
        </button>
      </div>

      {/* 2. ClickUp Views Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 pt-2 dark:border-border">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-muted-foreground">
          <button
            type="button"
            className="flex items-center gap-1 px-1 py-2 text-slate-500 hover:text-slate-900 transition-colors dark:hover:text-foreground"
          >
            <span className="font-bold text-slate-400">#</span>
            <span>Channel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("board")}
            className={`flex items-center gap-1.5 px-1 py-2 transition-colors ${
              activeTab === "board"
                ? "border-b-2 border-primary font-bold text-primary"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="18" x="3" y="3" rx="1" />
              <rect width="7" height="11" x="14" y="3" rx="1" />
            </svg>
            <span>Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-1.5 px-1 py-2 transition-colors ${
              activeTab === "list"
                ? "border-b-2 border-primary font-bold text-primary"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" x2="21" y1="6" y2="6" />
              <line x1="8" x2="21" y1="12" y2="12" />
              <line x1="8" x2="21" y1="18" y2="18" />
              <line x1="3" x2="3.01" y1="6" y2="6" />
              <line x1="3" x2="3.01" y1="12" y2="12" />
              <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
            <span>List</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-1 py-2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>View</span>
          </button>
        </div>

        {/* View Controls: Search, Columns, Filter */}
        <div className="flex items-center gap-2 pb-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter docs..."
              className="h-7 w-48 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary dark:border-border dark:bg-muted dark:text-foreground"
            />
          </div>

          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
          >
            <Columns3 className="h-3.5 w-3.5 text-slate-500" />
            <span>Columns</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-2 dark:border-border dark:bg-muted/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Group: All Documents</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium dark:text-muted-foreground">
          Showing {filteredDocs.length} of {docs.length} document{docs.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* 4. ClickUp List Table View */}
      <div className="flex-1 px-6 py-4">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-4 border-b border-slate-200 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:border-border">
          <div className="col-span-5 flex items-center gap-3">
            <span>Name</span>
          </div>
          <div className="col-span-2 text-center">Assignee / Owner</div>
          <div className="col-span-2 text-center">Pages</div>
          <div className="col-span-3 text-right pr-4">Last Modified & Actions</div>
        </div>

        {/* Group Header */}
        <div className="flex items-center gap-2 py-3">
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          <span className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/60 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary dark:bg-primary/20">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            DOCUMENTS
          </span>
          <span className="text-xs font-bold text-slate-500">{filteredDocs.length}</span>
        </div>

        {/* Table Rows */}
        <div className="flex flex-col divide-y divide-slate-100 border-y border-slate-100 dark:divide-border dark:border-border">
          {filteredDocs.map((doc) => {
            const pagesCount = getPagesCount(doc.content);
            const isEditing = editingId === doc.id;

            return (
              <div
                key={doc.id}
                onClick={() => !isEditing && onOpenDoc(doc.id)}
                className="group grid grid-cols-12 gap-4 items-center py-2.5 px-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-muted/40 transition-all cursor-pointer"
              >
                {/* 1. Name Column */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-dashed border-slate-400 group-hover:border-primary transition-colors">
                    <span className="h-1 w-1 rounded-full bg-slate-300 group-hover:bg-primary" />
                  </span>

                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    <FileText className="h-4 w-4" />
                  </span>

                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={() => handleSaveRename(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(doc.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border border-primary px-2 py-0.5 text-xs font-semibold text-slate-800 outline-none w-full dark:bg-card dark:text-foreground"
                    />
                  ) : (
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-bold text-slate-800 group-hover:text-primary transition-colors dark:text-foreground">
                        {doc.title || "Untitled document"}
                      </span>
                      <span className="text-[10.5px] text-slate-400 truncate">
                        ID: {doc.id.substring(0, 14)}...
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Assignee / Owner Avatar */}
                <div className="col-span-2 flex items-center justify-center">
                  <div
                    className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-[#78350f] bg-[#fef3c7] shadow-2xs border border-[#fde68a]"
                    title="Owner: Admin"
                  >
                    AM
                  </div>
                </div>

                {/* 3. Pages Count Badge */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                    {pagesCount} {pagesCount === 1 ? "page" : "pages"}
                  </span>
                </div>

                {/* 4. Last Modified & Hover Actions */}
                <div className="col-span-3 flex items-center justify-end gap-2 pr-2">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mr-2">
                    Today
                  </span>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenDoc(doc.id)}
                      className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                      title="Open document"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartRename(doc)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer dark:hover:bg-muted"
                      title="Rename"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateDoc(doc.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer dark:hover:bg-muted"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {docs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteDoc(doc.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer dark:hover:bg-rose-950/40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. ClickUp "+ Add Document" inline row */}
        <div className="mt-2 py-2">
          {isAddingInline ? (
            <form onSubmit={handleInlineSubmit} className="flex items-center gap-2 px-2">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-dashed border-primary text-primary">
                <Plus className="h-3 w-3" />
              </span>
              <input
                autoFocus
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                placeholder="Enter document title and press Enter..."
                className="h-8 flex-1 rounded border border-primary px-3 text-xs font-medium text-slate-800 outline-none shadow-xs dark:bg-card dark:text-foreground"
              />
              <button
                type="submit"
                className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAddingInline(false)}
                className="rounded px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 cursor-pointer dark:hover:bg-muted"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingInline(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary px-2 py-1.5 rounded hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              <span>Add Document</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
