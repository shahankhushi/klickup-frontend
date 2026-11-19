"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";

const emptySubscribe = () => () => {};

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void; ready: boolean }>({
  theme: "light",
  toggleTheme: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("klickup-theme");
      return stored === "dark" ? "dark" : "light";
    }
    return "light";
  });
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("klickup-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, ready }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
