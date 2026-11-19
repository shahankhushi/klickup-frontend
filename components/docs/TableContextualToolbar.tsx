"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Table2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Split,
  Heading1,
} from "lucide-react";

interface TableContextualToolbarProps {
  editor: Editor | null;
}

export function TableContextualToolbar({ editor }: TableContextualToolbarProps) {
  const [inTable, setInTable] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const checkTable = () => {
      const active =
        editor.isActive("table") ||
        editor.isActive("tableRow") ||
        editor.isActive("tableCell") ||
        editor.isActive("tableHeader");
      setInTable(active);
    };

    // Run check initially
    checkTable();

    editor.on("selectionUpdate", checkTable);
    editor.on("transaction", checkTable);

    return () => {
      editor.off("selectionUpdate", checkTable);
      editor.off("transaction", checkTable);
    };
  }, [editor]);

  if (!editor || !inTable) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label="Table options"
      className="flex min-h-9 w-full flex-wrap items-center gap-1 border-b border-violet-200 bg-violet-50/80 px-4 py-1 text-xs dark:border-violet-900/60 dark:bg-violet-950/40 animate-in fade-in slide-in-from-top-1 duration-150 select-none shadow-xs"
    >
      {/* Table Label Badge */}
      <div className="flex items-center gap-1.5 rounded-md bg-violet-200/80 px-2 py-0.5 text-[11px] font-bold text-violet-900 dark:bg-violet-800/60 dark:text-violet-100 uppercase tracking-wider mr-1 shadow-2xs">
        <Table2 className="h-3.5 w-3.5 stroke-[2.2]" />
        <span>Table</span>
      </div>

      <div className="h-4 w-px bg-violet-200 dark:bg-violet-800 mx-1" />

      {/* Row Operations */}
      <button
        type="button"
        title="Insert row above"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <ArrowUp className="h-3 w-3 text-violet-600" />
        <span>Row above</span>
      </button>

      <button
        type="button"
        title="Insert row below"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <ArrowDown className="h-3 w-3 text-violet-600" />
        <span>Row below</span>
      </button>

      <button
        type="button"
        title="Delete current row"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-2xs border border-transparent hover:border-rose-200 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
      >
        <Trash2 className="h-3 w-3 text-rose-500" />
        <span>Delete row</span>
      </button>

      <div className="h-4 w-px bg-violet-200 dark:bg-violet-800 mx-1" />

      {/* Column Operations */}
      <button
        type="button"
        title="Insert column before"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <ArrowLeft className="h-3 w-3 text-violet-600" />
        <span>Column before</span>
      </button>

      <button
        type="button"
        title="Insert column after"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <ArrowRight className="h-3 w-3 text-violet-600" />
        <span>Column after</span>
      </button>

      <button
        type="button"
        title="Delete current column"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-2xs border border-transparent hover:border-rose-200 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
      >
        <Trash2 className="h-3 w-3 text-rose-500" />
        <span>Delete column</span>
      </button>

      <div className="h-4 w-px bg-violet-200 dark:bg-violet-800 mx-1" />

      {/* Cell & Header Operations */}
      <button
        type="button"
        title="Merge selected cells or split merged cell"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().mergeOrSplit().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Split className="h-3 w-3 text-violet-600" />
        <span>Merge / split</span>
      </button>

      <button
        type="button"
        title="Toggle header row"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-violet-700 shadow-2xs border border-transparent hover:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Heading1 className="h-3 w-3 text-violet-600" />
        <span>Header row</span>
      </button>

      <div className="h-4 w-px bg-violet-200 dark:bg-violet-800 mx-1 ml-auto" />

      {/* Delete Table Operation */}
      <button
        type="button"
        title="Delete entire table"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 shadow-2xs dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
      >
        <Trash2 className="h-3 w-3" />
        <span>Delete table</span>
      </button>
    </div>
  );
}
