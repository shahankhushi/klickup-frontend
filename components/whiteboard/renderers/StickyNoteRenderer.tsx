"use client";

import { StickyNoteObject } from "../types";

interface StickyNoteRendererProps {
  object: StickyNoteObject;
  onTextChange?: (text: string) => void;
  isEditing?: boolean;
}

export function StickyNoteRenderer({ object, onTextChange, isEditing }: StickyNoteRendererProps) {
  const { color, text, fontSize = 16, fontWeight = "normal", fontStyle = "normal", textAlign = "left" } = object;

  return (
    <div
      className="w-full h-full p-4 rounded-sm shadow-md flex flex-col transition-shadow hover:shadow-lg relative overflow-hidden select-none"
      style={{
        backgroundColor: color || "#fef08a",
      }}
    >
      {/* Folded paper corner indicator */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none opacity-30"
        style={{
          background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%)",
        }}
      />

      {isEditing ? (
        <textarea
          autoFocus
          defaultValue={text}
          onChange={(e) => onTextChange?.(e.target.value)}
          className="w-full h-full bg-transparent resize-none border-none outline-none font-sans leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            fontStyle,
            textAlign,
            color: "#0f172a",
          }}
          placeholder="Type here..."
        />
      ) : (
        <div
          className="w-full h-full font-sans break-words whitespace-pre-wrap leading-relaxed overflow-hidden"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            fontStyle,
            textAlign,
            color: "#0f172a",
          }}
        >
          {text || <span className="opacity-40 italic">Sticky note</span>}
        </div>
      )}
    </div>
  );
}
