"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface PopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  align?: "left" | "right";
  matchWidth?: boolean;
  width?: number;
  className?: string;
}

export function Popover({
  open,
  anchorRef,
  panelRef,
  children,
  align = "left",
  matchWidth = false,
  width,
  className,
}: PopoverProps) {
  const [style, setStyle] = useState<CSSProperties>({});
  const mounted = useIsMounted();

  useEffect(() => {
    if (!open) return;

    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelWidth = matchWidth ? rect.width : (width ?? Math.max(rect.width, 200));
      let left = align === "right" ? rect.right - panelWidth : rect.left;
      left = Math.min(Math.max(8, left), window.innerWidth - panelWidth - 8);
      const openUp = window.innerHeight - rect.bottom < 240 && rect.top > 240;
      setStyle({
        position: "fixed",
        left,
        width: panelWidth,
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        zIndex: 80,
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [align, anchorRef, matchWidth, open, width]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-popover",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
