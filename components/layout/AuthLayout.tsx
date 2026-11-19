"use client";

import { Logo } from "@/components/layout/Logo";
import { useTheme } from "@/components/providers/ThemeProvider";
import { IconButton } from "@/components/ui/Button";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { theme, toggleTheme, ready } = useTheme();

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Logo light />
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/75">
            Khushi Motors & Khushi Media
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Centralized Workspace & Operations Portal
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/90 leading-relaxed">
            Specially built to organize and streamline Khushi Media &amp; Khushi Motors departmental projects, daily operations, task execution, and team deliverables.
          </p>
          <ul className="mt-6 space-y-3.5 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shrink-0" />
              <span><strong>Creative &amp; Production:</strong> Video shoots, reels, post-production &amp; visual designs.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
              <span><strong>Performance Marketing:</strong> Lead gen campaigns, ad spend tracking &amp; audience targeting.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-300 shrink-0" />
              <span><strong>ERP &amp; Web Systems:</strong> Vehicle inventory portals, backend sync &amp; automations.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-purple-300 shrink-0" />
              <span><strong>Data-Upload &amp; HR:</strong> Stock listings, vehicle specs cataloging &amp; team oversight.</span>
            </li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/75 font-medium">
          Khushi Motors &bull; Khushi Media Internal Operations Portal
        </p>
      </section>
      <section className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4">
          <IconButton label="Toggle color theme" onClick={toggleTheme}>
            {ready && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </div>
  );
}
