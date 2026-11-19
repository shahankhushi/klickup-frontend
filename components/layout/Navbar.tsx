"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { useDismiss } from "@/lib/use-dismiss";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import { cn, focusRing } from "@/lib/utils";
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme, ready } = useTheme();
  const { currentUser, tasks, projects, users, notifications, markNotificationsRead, isSuperAdmin } = useAppData();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchAnchor = useRef<HTMLDivElement>(null);
  const searchPanel = useRef<HTMLDivElement>(null);
  const notesAnchor = useRef<HTMLButtonElement>(null);
  const notesPanel = useRef<HTMLDivElement>(null);
  useDismiss(searchOpen, () => setSearchOpen(false), searchAnchor, searchPanel);
  useDismiss(notesOpen, () => setNotesOpen(false), notesAnchor, notesPanel);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const unread = notifications.filter((item) => item.unread).length;
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const leads = canLeadWorkspace(currentUser.role);
    const taskHits = tasks
      .filter((task) => leads || task.assigneeId === currentUser.id)
      .filter((task) => task.title.toLowerCase().includes(term))
      .slice(0, 4)
      .map((task) => ({ id: task.id, label: task.title, meta: "Task", href: `/tasks/${task.id}` }));
    const projectHits = leads
      ? projects
          .filter((project) => project.name.toLowerCase().includes(term))
          .slice(0, 3)
          .map((project) => ({ id: project.id, label: project.name, meta: "Project", href: `/projects?project=${project.id}` }))
      : [];
    const peopleHits = leads
      ? users
          .filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
          .slice(0, 3)
          .map((user) => ({ id: user.id, label: user.name, meta: user.title, href: "/team" }))
      : [];
    return [...taskHits, ...projectHits, ...peopleHits].slice(0, 8);
  }, [currentUser.id, currentUser.role, projects, query, tasks, users]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur md:gap-3 md:px-4">
      <IconButton label="Open navigation" className="md:hidden" onClick={onOpenMenu}>
        <Menu className="h-4 w-4" />
      </IconButton>
      <div ref={searchAnchor} className="relative min-w-0 flex-1 md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search Ctrl+K"
          aria-label="Search the workspace"
          className={cn(
            "h-8 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-xs text-foreground shadow-xs placeholder:text-muted-foreground",
            focusRing,
          )}
        />
        <Popover open={searchOpen && query.trim().length > 0} anchorRef={searchAnchor} panelRef={searchPanel} matchWidth>
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matches for “{query.trim()}”.</p>
          ) : (
            <ul className="max-h-80 overflow-auto p-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <span className="truncate text-foreground">{result.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{result.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Popover>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Toggle color theme" onClick={toggleTheme} suppressHydrationWarning>
          {ready && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>
        <button
          ref={notesAnchor}
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted", focusRing)}
          onClick={() => setNotesOpen((open) => !open)}
          suppressHydrationWarning
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span suppressHydrationWarning className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
        <Popover open={notesOpen} anchorRef={notesAnchor} panelRef={notesPanel} align="right" width={320}>
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button type="button" className="text-xs font-medium text-primary" onClick={markNotificationsRead}>
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-auto p-1">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href ?? "/dashboard"}
                  onClick={() => setNotesOpen(false)}
                  className="block rounded-md px-2.5 py-2 hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                  <RelativeTime value={item.createdAt} className="text-[11px] text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Popover>
        <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-bold tracking-tight",
              isSuperAdmin
                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {isSuperAdmin ? "👑 Super Admin" : "👤 Employee"}
          </span>
        </div>
        <DropdownMenu
          align="right"
          label="Account menu"
          trigger={
            <button type="button" className={cn("rounded-full", focusRing)} aria-label="Account menu">
              <Avatar name={currentUser.name} src={currentUser.avatarUrl} color={currentUser.color} size="sm" />
            </button>
          }
          items={[
            {
              id: "profile",
              label: "Profile",
              icon: <UserRound className="h-4 w-4" />,
              onSelect: () => router.push("/settings?tab=profile"),
            },
            {
              id: "settings",
              label: "Settings",
              icon: <Settings className="h-4 w-4" />,
              onSelect: () => router.push("/settings"),
            },
            {
              id: "logout",
              label: "Log out",
              icon: <LogOut className="h-4 w-4" />,
              danger: true,
              onSelect: () => router.push("/login"),
            },
          ]}
        />
      </div>
    </header>
  );
}
