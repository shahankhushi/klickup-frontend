"use client";

import { FrameObject } from "../types";

interface FrameRendererProps {
  object: FrameObject;
  onTitleChange?: (title: string) => void;
  isEditing?: boolean;
}

export function FrameRenderer({ object, onTitleChange, isEditing }: FrameRendererProps) {
  const { title, stroke = "#94a3b8", fill = "rgba(255,255,255,0.4)" } = object;

  return (
    <div
      className="w-full h-full rounded-md border relative transition-colors select-none"
      style={{
        borderColor: stroke,
        backgroundColor: fill,
      }}
    >
      {/* ClickUp Frame title tab at top-left */}
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 rounded-t text-xs font-semibold border border-b-0 flex items-center gap-1 bg-white"
        style={{
          borderColor: stroke,
          color: "#475569",
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            defaultValue={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="outline-none bg-transparent text-xs w-24 font-semibold"
          />
        ) : (
          <span>{title || "Frame"}</span>
        )}
      </div>
    </div>
  );
}
