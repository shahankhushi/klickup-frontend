"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  ArrowLeft,
  Bold,
  CheckSquare,
  ChevronRight,
  Code2,
  Copy,
  FilePlus2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Quote,
  Redo2,
  RotateCcw,
  Share2,
  Star,
  Strikethrough,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";
import { DocsListView, type DocItem } from "@/components/docs/DocsListView";
import { DocsSidebar, type DocPageItem } from "@/components/docs/DocsSidebar";
import { TableContextualToolbar } from "@/components/docs/TableContextualToolbar";

type Content = { type: string; content?: Content[]; text?: string; [key: string]: unknown };
type Doc = DocItem;
type Version = { id: string; title: string; content: string; createdAt: string };

const API = process.env.NEXT_PUBLIC_API_URL || "";
const DOCS_CACHE_KEY = "klickup-docs-cache";
const EMPTY: Content = { type: "doc", content: [{ type: "paragraph" }] };
const TABLE_SIZE = { rows: 3, cols: 3, withHeaderRow: true } as const;

function getDocsApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  return "";
}

const DEFAULT_DOCS: Doc[] = [
  {
    id: "doc_onboarding_1",
    title: "🚀 KlickUp Workspace Overview & Guide",
    icon: "📄",
    visibility: "workspace",
    isPinned: true,
    isFavorite: true,
    updatedAt: new Date().toISOString(),
    content: JSON.stringify({
      isMultiPage: true,
      activePageId: "p_1",
      pages: [
        {
          id: "p_1",
          title: "Overview",
          icon: "📄",
          content: {
            type: "doc",
            content: [
              { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to KlickUp" }] },
              { type: "paragraph", content: [{ type: "text", text: "KlickUp is an all-in-one productivity platform for fast-moving teams. Manage tasks, collaborate on docs, whiteboard workflows, and track team progress seamlessly." }] },
              { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Active Spaces" }] },
              { type: "bulletList", content: [
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Performance: Ads, Meta Campaigns, and Analytics" }] }] },
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Creative: Graphic design, video shoots, copywriting" }] }] },
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "ERP/Web: Systems, integrations, inventory synchronization" }] }] },
              ] },
              { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Quick Start Checklist" }] },
              { type: "taskList", content: [
                { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Explore the List & Kanban views" }] }] },
                { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Check the visual Whiteboard canvas" }] }] },
                { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Create your first document or task" }] }] },
              ] },
            ]
          }
        }
      ]
    })
  },
  {
    id: "doc_sprint_2",
    title: "📋 Q4 Sprint Plan & Deliverables",
    icon: "🎯",
    visibility: "workspace",
    isPinned: false,
    isFavorite: false,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    content: JSON.stringify({
      isMultiPage: true,
      activePageId: "p_s1",
      pages: [
        {
          id: "p_s1",
          title: "Sprint Goals",
          icon: "🎯",
          content: {
            type: "doc",
            content: [
              { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Q4 Sprint Plan" }] },
              { type: "paragraph", content: [{ type: "text", text: "Objective: Ship feature milestones, improve conversion funnels, and streamline team workflows." }] },
              { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Deliverables" }] },
              { type: "taskList", content: [
                { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Automated email sequences setup" }] }] },
                { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Lead management pipeline review" }] }] },
                { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Dashboard metrics aggregation" }] }] },
              ] }
            ]
          }
        }
      ]
    })
  }
];

function cacheDocs(list: Doc[]) {
  try {
    localStorage.setItem(DOCS_CACHE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

function readCachedDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(DOCS_CACHE_KEY);
    if (!raw) {
      cacheDocs(DEFAULT_DOCS);
      return DEFAULT_DOCS;
    }
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    cacheDocs(DEFAULT_DOCS);
    return DEFAULT_DOCS;
  } catch {
    return DEFAULT_DOCS;
  }
}

const TEMPLATES: Record<string, Content> = {
  "Meeting notes": {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Meeting notes" }] },
      { type: "paragraph", content: [{ type: "text", text: "Date: " }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Attendees" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Action items" }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph" }] }] },
    ],
  },
  "Project proposal": {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Project proposal" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Overview" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Goals" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
    ],
  },
  "Weekly report": {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Weekly work report" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Progress" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Next week" }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph" }] }] },
    ],
  },
};

const parse = (input: unknown): Content => {
  if (input && typeof input === "object" && (input as Content).type === "doc") {
    return input as Content;
  }
  if (typeof input === "string") {
    try {
      const value = JSON.parse(input) as unknown;
      if (typeof value === "string") return parse(value);
      if (value && typeof value === "object" && (value as Content).type === "doc") return value as Content;
    } catch {
      return EMPTY;
    }
  }
  return EMPTY;
};

function parsePagesFromDoc(doc: Doc): { pages: DocPageItem[]; activePageId: string } {
  try {
    const raw = typeof doc.content === "string" ? JSON.parse(doc.content) : doc.content;
    if (
      raw &&
      typeof raw === "object" &&
      "isMultiPage" in raw &&
      Array.isArray((raw as { pages?: unknown[] }).pages) &&
      (raw as { pages: unknown[] }).pages.length > 0
    ) {
      const pgs: DocPageItem[] = (raw as { pages: Array<{ id?: string; title?: string; icon?: string; content?: unknown }> }).pages.map(
        (p, idx) => ({
          id: p.id || `page_${idx + 1}`,
          title: p.title || `Page ${idx + 1}`,
          icon: p.icon || "📄",
          content: parse(p.content),
        })
      );
      const targetActId = (raw as { activePageId?: string }).activePageId;
      const actId = pgs.some((p) => p.id === targetActId) ? (targetActId as string) : pgs[0].id;
      return { pages: pgs, activePageId: actId };
    }
  } catch {}

  const defaultPage: DocPageItem = {
    id: "page_default_1",
    title: doc.title || "Page 1",
    icon: doc.icon || "📄",
    content: parse(doc.content),
  };
  return { pages: [defaultPage], activePageId: "page_default_1" };
}

function safeUrl(input: string) {
  try {
    const url = new URL(input);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-7 min-w-7 place-items-center rounded-md px-1.5 transition-colors cursor-pointer disabled:opacity-35 ${
        active
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onImage,
  onInsertTable,
}: {
  editor: Editor;
  onImage: () => void;
  onInsertTable: () => void;
}) {
  const link = () => {
    const value = window.prompt("Paste an http, https, or mailto link:", editor.getAttributes("link").href || "");
    if (value === null) return;
    if (!value) return void editor.chain().focus().unsetLink().run();
    const href = safeUrl(value);
    if (!href) return void window.alert("Use a safe http, https, or mailto link.");
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-0.5 border-b border-border bg-card px-4 py-1.5 shadow-xs">
      <Tool label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-3.5 w-3.5" />
      </Tool>
      <Tool label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-3.5 w-3.5" />
      </Tool>
      <i className="mx-1 h-5 w-px bg-border" />
      <select
        aria-label="Text style"
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
            ? "h2"
            : editor.isActive("heading", { level: 3 })
            ? "h3"
            : "p"
        }
        onChange={(e) => {
          const c = editor.chain().focus();
          const v = e.target.value;
          v === "p" ? c.setParagraph().run() : c.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
        }}
        className="h-7 rounded bg-transparent px-1 text-xs font-medium outline-none hover:bg-muted cursor-pointer"
      >
        <option value="p">Text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <i className="mx-1 h-5 w-px bg-border" />
      <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </Tool>
      <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Strike"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Tool>
      <label title="Text color" className="grid h-7 w-7 cursor-pointer place-items-center rounded hover:bg-muted">
        <span
          className="h-3.5 w-3.5 rounded border"
          style={{ background: editor.getAttributes("textStyle").color || "#111827" }}
        />
        <input
          className="sr-only"
          type="color"
          value={editor.getAttributes("textStyle").color || "#111827"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <Tool
        label="Highlight"
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </Tool>
      <Tool label="Link" active={editor.isActive("link")} onClick={link}>
        <Link2 className="h-3.5 w-3.5" />
      </Tool>
      <i className="mx-1 h-5 w-px bg-border" />
      <Tool
        label="Align left"
        active={editor.isActive({ textAlign: "left" }) || (!editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Tool>
      <i className="mx-1 h-5 w-px bg-border" />
      <Tool
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Checklist"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </Tool>
      <Tool
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-3.5 w-3.5" />
      </Tool>
      <i className="mx-1 h-5 w-px bg-border" />
      <Tool label="Insert table" onClick={onInsertTable}>
        <Table2 className="h-3.5 w-3.5" />
      </Tool>
      <Tool label="Upload image" onClick={onImage}>
        <ImagePlus className="h-3.5 w-3.5" />
      </Tool>
      <Tool label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <span className="w-3.5 border-t border-current" />
      </Tool>
    </div>
  );
}

export default function DocsPage() {
  const [pageView, setPageView] = useState<"list" | "editor">("list");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("loading");
  const [saved, setSaved] = useState<Date | null>(null);

  // Pages state for the currently active document
  const [pages, setPages] = useState<DocPageItem[]>([
    { id: "page_default_1", title: "Page 1", icon: "📄", content: EMPTY },
  ]);
  const [activePageId, setActivePageId] = useState<string>("page_default_1");

  const [slash, setSlash] = useState("");
  const [selectedSlash, setSelectedSlash] = useState(0);
  const [slashMenu, setSlashMenu] = useState<{ top: number; left: number } | null>(null);
  const [templates, setTemplates] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [history, setHistory] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);

  const upload = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef<string | null>(null);
  const titleRef = useRef("");
  const pagesRef = useRef<DocPageItem[]>(pages);
  pagesRef.current = pages;
  const activePageIdRef = useRef<string>(activePageId);
  activePageIdRef.current = activePageId;

  const editorRef = useRef<Editor | null>(null);
  const applyingRef = useRef(false);
  const pendingContentRef = useRef<Content | null>(null);
  const persistRef = useRef<(
    content?: Content,
    patch?: Record<string, unknown>,
    customPages?: DocPageItem[],
    customActivePageId?: string
  ) => Promise<void>>(async () => {});

  const slashRef = useRef("");
  slashRef.current = slash;
  const selectedSlashRef = useRef(0);
  selectedSlashRef.current = selectedSlash;

  const current = docs.find((doc) => doc.id === id);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const request = useCallback(async (path: string, options?: RequestInit) => {
    const api = getDocsApiUrl();
    if (!api) throw new Error("Standalone demo mode");
    const r = await fetch(`${api}/api/documents${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!r.ok) throw new Error();
    return r.status === 204 ? null : r.json();
  }, []);

  const commands: [string, string, React.ElementType][] = [
    ["table", "Table", Table2],
    ["h1", "Heading 1", Heading1],
    ["h2", "Heading 2", Heading2],
    ["h3", "Heading 3", Heading3],
    ["bullet", "Bulleted list", List],
    ["numbered", "Numbered list", ListOrdered],
    ["checklist", "Checklist", CheckSquare],
    ["image", "Image", ImagePlus],
    ["quote", "Quote", Quote],
    ["code", "Code block", Code2],
    ["divider", "Divider", MoreHorizontal],
  ];

  const filteredCommands = commands.filter(
    ([key, label]) => key.includes(slash) || label.toLowerCase().includes(slash)
  );

  const slashFrom = useCallback((next: Editor) => {
    const text = next.state.selection.$from.parent.textContent;
    if (text.startsWith("/")) {
      setSlash(text.slice(1).toLowerCase());
      setSelectedSlash(0);
      try {
        const coords = next.view.coordsAtPos(next.state.selection.from);
        const box = next.view.dom.getBoundingClientRect();
        setSlashMenu({
          top: coords.bottom - box.top + 8,
          left: Math.max(0, coords.left - box.left),
        });
      } catch {
        setSlashMenu({ top: 28, left: 0 });
      }
    } else {
      setSlash("");
      setSlashMenu(null);
    }
  }, []);

  const runCommand = useCallback((command: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const { state } = ed;
    const start = state.selection.$from.start();
    const from = state.selection.from;

    ed.chain()
      .focus()
      .command(({ tr }) => {
        tr.delete(start, Math.max(start, from));
        return true;
      })
      .run();

    const c = ed.chain().focus();
    if (command === "table") {
      c.insertTable(TABLE_SIZE).run();
    } else if (command === "h1") {
      c.toggleHeading({ level: 1 }).run();
    } else if (command === "h2") {
      c.toggleHeading({ level: 2 }).run();
    } else if (command === "h3") {
      c.toggleHeading({ level: 3 }).run();
    } else if (command === "bullet") {
      c.toggleBulletList().run();
    } else if (command === "numbered") {
      c.toggleOrderedList().run();
    } else if (command === "checklist") {
      c.toggleTaskList().run();
    } else if (command === "image") {
      upload.current?.click();
    } else if (command === "quote") {
      c.toggleBlockquote().run();
    } else if (command === "code") {
      c.toggleCodeBlock().run();
    } else {
      c.setHorizontalRule().run();
    }

    setSlash("");
    setSelectedSlash(0);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands, or start writing…" }),
      Typography,
    ],
    content: EMPTY,
    editorProps: {
      attributes: { class: "doc-prosemirror" },
      handleKeyDown: (view, event) => {
        if (slashRef.current !== "") {
          const list = commands.filter(
            ([key, label]) =>
              key.includes(slashRef.current) || label.toLowerCase().includes(slashRef.current)
          );
          if (list.length > 0) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedSlash((prev) => (prev + 1) % list.length);
              return true;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedSlash((prev) => (prev - 1 + list.length) % list.length);
              return true;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const target = list[selectedSlashRef.current] || list[0];
              runCommand(target[0]);
              return true;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setSlash("");
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      if (applyingRef.current) return;
      slashFrom(e);
      queue(e.getJSON());
    },
    onSelectionUpdate: ({ editor: e }) => {
      slashFrom(e);
    },
  });

  editorRef.current = editor;

  function applyContent(content: unknown) {
    const ed = editorRef.current;
    const parsed = parse(content);
    if (!ed) {
      pendingContentRef.current = parsed;
      return;
    }
    applyingRef.current = true;
    ed.commands.setContent(parsed, { emitUpdate: false });
    applyingRef.current = false;
    pendingContentRef.current = null;
  }

  const persist = useCallback(
    async (
      content?: Content,
      patch: Record<string, unknown> = {},
      customPages?: DocPageItem[],
      customActivePageId?: string
    ) => {
      const target = idRef.current;
      if (!target) return;

      const currentPgId = customActivePageId || activePageIdRef.current;
      const edContent = content || editorRef.current?.getJSON() || EMPTY;

      const allPages = (customPages || pagesRef.current).map((p) =>
        p.id === currentPgId ? { ...p, content: edContent } : p
      );

      const payloadContent = {
        isMultiPage: true,
        activePageId: currentPgId,
        pages: allPages,
      };

      const nextTitle = titleRef.current;
      const updatedAt = new Date().toISOString();
      const skipApi = target.startsWith("local_");

      setStatus("saving");
      setDocs((all) => {
        const next = all.map((item) =>
          item.id === target
            ? {
                ...item,
                ...patch,
                title: nextTitle,
                content: JSON.stringify(payloadContent),
                updatedAt,
              }
            : item
        );
        cacheDocs(next);
        return next;
      });

      if (skipApi) {
        setSaved(new Date(updatedAt));
        setStatus("saved");
        return;
      }

      try {
        const json = await request(`/${target}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: nextTitle,
            content: payloadContent,
            ...patch,
          }),
        });
        const doc = json.data as Doc;
        setDocs((all) => {
          const next = all.map((item) => (item.id === target ? doc : item));
          cacheDocs(next);
          return next;
        });
        setSaved(new Date(doc.updatedAt));
        setStatus("saved");
      } catch {
        setSaved(new Date(updatedAt));
        setStatus("saved");
      }
    },
    [request]
  );

  persistRef.current = persist;

  function queue(content?: Content) {
    if (!idRef.current || applyingRef.current) return;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persistRef.current(content);
    }, 600);
  }

  const activate = useCallback((doc: Doc) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      void persistRef.current();
    }
    idRef.current = doc.id;
    setId(doc.id);
    setTitle(doc.title);
    titleRef.current = doc.title;
    setStatus("saved");
    setSaved(new Date(doc.updatedAt));
    setSlash("");
    setSlashMenu(null);

    // Extract pages
    const { pages: parsedPages, activePageId: actId } = parsePagesFromDoc(doc);
    setPages(parsedPages);
    pagesRef.current = parsedPages;
    setActivePageId(actId);
    activePageIdRef.current = actId;

    const activePg = parsedPages.find((p) => p.id === actId) || parsedPages[0];
    applyContent(activePg.content);
  }, []);

  const handleSelectPage = (nextPageId: string) => {
    if (nextPageId === activePageIdRef.current) return;
    const ed = editorRef.current;
    const currentContent = ed ? ed.getJSON() : EMPTY;

    const updatedPages = pagesRef.current.map((p) =>
      p.id === activePageIdRef.current ? { ...p, content: currentContent } : p
    );
    setPages(updatedPages);
    pagesRef.current = updatedPages;
    setActivePageId(nextPageId);
    activePageIdRef.current = nextPageId;

    const target = updatedPages.find((p) => p.id === nextPageId);
    if (target) {
      applyContent(target.content);
    }

    void persist(undefined, undefined, updatedPages, nextPageId);
  };

  const handleAddPage = (pageTitle?: string) => {
    const ed = editorRef.current;
    const currentContent = ed ? ed.getJSON() : EMPTY;

    const updatedPages = pagesRef.current.map((p) =>
      p.id === activePageIdRef.current ? { ...p, content: currentContent } : p
    );

    const newPage: DocPageItem = {
      id: `page_${Date.now()}`,
      title: pageTitle || `Page ${updatedPages.length + 1}`,
      icon: "📄",
      content: EMPTY,
    };

    const nextPages = [...updatedPages, newPage];
    setPages(nextPages);
    pagesRef.current = nextPages;
    setActivePageId(newPage.id);
    activePageIdRef.current = newPage.id;

    applyContent(EMPTY);
    setTimeout(() => {
      editorRef.current?.commands.focus();
    }, 50);

    void persist(undefined, undefined, nextPages, newPage.id);
  };

  const handleRenamePage = (pageId: string, newTitle: string) => {
    const nextPages = pagesRef.current.map((p) =>
      p.id === pageId ? { ...p, title: newTitle } : p
    );
    setPages(nextPages);
    pagesRef.current = nextPages;
    void persist(undefined, undefined, nextPages, activePageIdRef.current);
  };

  const handleDeletePage = (pageId: string) => {
    if (pagesRef.current.length <= 1) return;
    const nextPages = pagesRef.current.filter((p) => p.id !== pageId);
    let nextActiveId = activePageIdRef.current;

    if (activePageIdRef.current === pageId) {
      nextActiveId = nextPages[0].id;
      applyContent(nextPages[0].content);
    }

    setPages(nextPages);
    pagesRef.current = nextPages;
    setActivePageId(nextActiveId);
    activePageIdRef.current = nextActiveId;

    void persist(undefined, undefined, nextPages, nextActiveId);
  };

  const create = useCallback(
    async (newTitle?: string, template?: string) => {
      const initialPage: DocPageItem = {
        id: `page_${Date.now()}`,
        title: "Page 1",
        icon: "📄",
        content: template ? TEMPLATES[template] : EMPTY,
      };

      const payloadContent = {
        isMultiPage: true,
        activePageId: initialPage.id,
        pages: [initialPage],
      };

      const local: Doc = {
        id: `local_${Date.now()}`,
        title: newTitle || template || "Untitled document",
        icon: "📄",
        content: JSON.stringify(payloadContent),
        visibility: "workspace",
        isPinned: false,
        isFavorite: false,
        updatedAt: new Date().toISOString(),
      };

      try {
        const json = await request("/", {
          method: "POST",
          body: JSON.stringify({
            title: local.title,
            content: payloadContent,
          }),
        });
        const doc = json.data as Doc;
        setDocs((all) => {
          const next = [doc, ...all];
          cacheDocs(next);
          return next;
        });
        activate(doc);
        setPageView("editor");
        setTemplates(false);
      } catch {
        setDocs((all) => {
          const next = [local, ...all];
          cacheDocs(next);
          return next;
        });
        activate(local);
        setPageView("editor");
        setTemplates(false);
        setStatus("saved");
      }
    },
    [activate, request]
  );

  const renameDoc = useCallback(
    async (docId: string, newTitle: string) => {
      setDocs((all) => {
        const next = all.map((d) =>
          d.id === docId ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d
        );
        cacheDocs(next);
        return next;
      });
      if (idRef.current === docId) {
        setTitle(newTitle);
        titleRef.current = newTitle;
      }
      try {
        await request(`/${docId}`, {
          method: "PATCH",
          body: JSON.stringify({ title: newTitle }),
        });
      } catch {}
    },
    [request]
  );

  const deleteDoc = useCallback(
    async (docId: string) => {
      setDocs((all) => {
        const next = all.filter((d) => d.id !== docId);
        cacheDocs(next);
        return next;
      });
      if (idRef.current === docId) {
        setPageView("list");
        idRef.current = null;
        setId(null);
      }
      try {
        await request(`/${docId}`, { method: "DELETE" });
      } catch {}
    },
    [request]
  );

  const duplicateDoc = useCallback(
    async (docId: string) => {
      try {
        const json = await request(`/${docId}/duplicate`, { method: "POST" });
        const doc = json.data as Doc;
        setDocs((all) => {
          const next = [doc, ...all];
          cacheDocs(next);
          return next;
        });
      } catch {}
    },
    [request]
  );

  const onOpenDoc = (docId: string) => {
    const target = docs.find((d) => d.id === docId);
    if (target) {
      activate(target);
      setPageView("editor");
    }
  };

  useEffect(() => {
    (async () => {
      const cached = readCachedDocs();
      if (cached.length) {
        setDocs(cached);
      }
      try {
        const json = await request("/");
        const list = json.data as Doc[];
        setDocs(list);
        cacheDocs(list);
        setStatus("saved");
      } catch {
        if (!cached.length) {
          setDocs(DEFAULT_DOCS);
          cacheDocs(DEFAULT_DOCS);
        }
        setStatus("saved");
      }
    })();

    const handleReset = () => {
      setPageView("list");
    };
    window.addEventListener("klickup_reset_docs_view", handleReset);

    return () => {
      window.removeEventListener("klickup_reset_docs_view", handleReset);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [request]);

  useEffect(() => {
    if (editor && pendingContentRef.current) {
      applyContent(pendingContentRef.current);
    }
  }, [editor]);

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  async function duplicate() {
    if (!id) return;
    try {
      const json = await request(`/${id}/duplicate`, { method: "POST" });
      const doc = json.data as Doc;
      setDocs((all) => [doc, ...all]);
      activate(doc);
    } catch {
      setStatus("error");
    }
  }

  async function archive() {
    if (!id) return;
    try {
      await request(`/${id}/archive`, { method: "POST", body: JSON.stringify({ archived: true }) });
      const list = docs.filter((doc) => doc.id !== id);
      setDocs(list);
      cacheDocs(list);
      setPageView("list");
    } catch {
      setStatus("error");
    }
  }

  async function addImage(file: File) {
    if (!editor) return;
    setStatus("saving");
    try {
      const body = new FormData();
      body.append("image", file);
      const r = await fetch(`${API}/api/documents/upload-image`, { method: "POST", body });
      if (!r.ok) throw new Error();
      const json = await r.json();
      editor.chain().focus().setImage({ src: `${API}${json.data.url}`, alt: json.data.alt }).run();
    } catch {
      setStatus("error");
    }
  }

  async function versionsOpen() {
    if (!id) return;
    try {
      const json = await request(`/${id}/versions`);
      setVersions(json.data);
      setHistory(true);
    } catch {
      setStatus("error");
    }
  }

  async function restore(version: Version) {
    if (!id || !confirm(`Restore this version from ${new Date(version.createdAt).toLocaleString()}?`)) return;
    try {
      const json = await request(`/${id}/versions/${version.id}/restore`, { method: "POST" });
      const doc = json.data as Doc;
      setDocs((all) => all.map((item) => (item.id === doc.id ? doc : item)));
      activate(doc);
      setHistory(false);
    } catch {
      setStatus("error");
    }
  }

  const handleInsertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable(TABLE_SIZE).run();
  };

  const toggleFavorite = async () => {
    if (!current) return;
    const next = !current.isFavorite;
    setDocs((all) => all.map((d) => (d.id === current.id ? { ...d, isFavorite: next } : d)));
    await persist(undefined, { isFavorite: next });
  };

  // If pageView is "list", render the ClickUp-style Docs Table List View!
  if (pageView === "list") {
    return (
      <DocsListView
        docs={docs}
        onOpenDoc={onOpenDoc}
        onCreateNewDoc={(name) => create(name)}
        onRenameDoc={renameDoc}
        onDeleteDoc={deleteDoc}
        onDuplicateDoc={duplicateDoc}
      />
    );
  }

  if (!editor || status === "loading") {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading document…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      {/* 1. Left Sidebar: Document Title & Pages Management with "+ Add Page" feature */}
      <DocsSidebar
        documentTitle={title}
        documentIcon={current?.icon || "📄"}
        pages={pages}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onRenamePage={handleRenamePage}
        onDeletePage={handleDeletePage}
        onBackToList={() => setPageView("list")}
      />

      {/* 2. Main Document Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {/* Back to Docs List button */}
            <button
              type="button"
              onClick={() => setPageView("list")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-muted dark:hover:text-foreground transition-colors mr-1 border border-border shadow-2xs cursor-pointer"
              title="Back to Documents List"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setPageView("list")}
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4 text-violet-600" />
              <span className="font-medium">Docs</span>
            </button>

            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="truncate font-semibold text-foreground max-w-48 sm:max-w-xs">
              {title || "Untitled document"}
            </span>

            {activePage && pages.length > 1 && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="truncate text-primary font-medium">{activePage.title}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`hidden text-xs sm:block ${
                status === "error" ? "text-danger" : "text-muted-foreground"
              }`}
            >
              {status === "saving"
                ? "Saving…"
                : status === "error"
                ? "Save failed"
                : `Saved${saved ? ` ${saved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
            </span>

            <Tool label="Favorite" active={current?.isFavorite} onClick={toggleFavorite}>
              <Star className={`h-3.5 w-3.5 ${current?.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </Tool>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSharing(!sharing)}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
              {sharing && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border bg-popover p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs font-semibold">Visibility</p>
                  {(["private", "workspace", "department", "project"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        persist(undefined, { visibility: v });
                        setSharing(false);
                      }}
                      className={`flex w-full justify-between rounded px-2 py-2 text-left text-xs capitalize hover:bg-muted cursor-pointer ${
                        current?.visibility === v ? "text-primary font-medium" : ""
                      }`}
                    >
                      {v}
                      <span>{current?.visibility === v && "✓"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={versionsOpen}
              title="Version history"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <details className="relative">
              <summary
                title="More actions"
                className="list-none rounded-md p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg">
                <button
                  type="button"
                  onClick={duplicate}
                  className="flex w-full gap-2 rounded px-2 py-2 text-xs hover:bg-muted cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={archive}
                  className="flex w-full gap-2 rounded px-2 py-2 text-xs text-danger hover:bg-muted cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => id && deleteDoc(id)}
                  className="flex w-full gap-2 rounded px-2 py-2 text-xs text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete doc</span>
                </button>
              </div>
            </details>
          </div>
        </header>

        {/* 3. Primary Formatting Toolbar */}
        <Toolbar editor={editor} onImage={() => upload.current?.click()} onInsertTable={handleInsertTable} />

        {/* 4. Contextual Table Options Toolbar - ONLY visible when clicked inside any table! */}
        <TableContextualToolbar editor={editor} />

        {/* 5. Document Canvas Body */}
        <section className="relative flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full max-w-4xl px-5 py-9 sm:px-10">
            <div className="mx-auto max-w-3xl">
              {/* Document Title Input */}
              <input
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  setDocs((all) => all.map((d) => (d.id === id ? { ...d, title: val } : d)));
                  queue();
                }}
                onBlur={() => persist()}
                placeholder="Untitled document"
                className="mb-1 w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
              />

              {/* Sub-bar with page indicator and status */}
              <div className="mb-7 flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  {current?.visibility === "private"
                    ? "Private document"
                    : `${current?.visibility || "workspace"} visible`}{" "}
                  · Rich text saves automatically
                </p>

                {pages.length > 1 && (
                  <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/50">
                    Editing: {activePage?.title || "Page"}
                  </span>
                )}
              </div>

              {/* ProseMirror Tiptap Editor */}
              <div className="relative">
                <EditorContent editor={editor} />

                {/* Slash commands menu */}
                {slash !== "" && (
                  <div
                    className="absolute z-30 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-2xl"
                    style={{ top: slashMenu?.top ?? 28, left: slashMenu?.left ?? 0 }}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Insert Block
                    </div>
                    {filteredCommands.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No matches found</div>
                    ) : (
                      filteredCommands.map(([key, label, Icon], idx) => {
                        const isSelected = idx === selectedSlash;
                        return (
                          <button
                            key={key}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              runCommand(key);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              runCommand(key);
                            }}
                            onMouseEnter={() => setSelectedSlash(idx)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-violet-50 font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                                : "text-foreground/90 hover:bg-muted"
                            }`}
                          >
                            <div
                              className={`grid h-6 w-6 place-items-center rounded-md border ${
                                isSelected
                                  ? "border-violet-300 bg-white dark:border-violet-500/40 dark:bg-violet-950/40"
                                  : "border-border bg-card"
                              }`}
                            >
                              <Icon
                                className={`h-3.5 w-3.5 ${
                                  isSelected
                                    ? "text-violet-600 dark:text-violet-300"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <span className="flex-1">{label}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono text-violet-500">↵ Enter</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hidden File input for images */}
      <input
        ref={upload}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addImage(file);
          e.currentTarget.value = "";
        }}
      />

      {/* Choose Template Modal */}
      {templates && (
        <Modal title="Choose a template" onClose={() => setTemplates(false)}>
          {Object.keys(TEMPLATES).map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => create(undefined, template)}
              className="mb-2 flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm font-medium hover:border-primary hover:bg-muted cursor-pointer"
            >
              <FileText className="h-5 w-5 text-violet-600" />
              <span>{template}</span>
            </button>
          ))}
        </Modal>
      )}

      {/* Version History Modal */}
      {history && (
        <Modal title="Version history" onClose={() => setHistory(false)}>
          {versions.length ? (
            versions.map((version) => (
              <div
                key={version.id}
                className="mb-2 flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{version.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(version)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No earlier checkpoint yet.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
