"use client";

import { TextObject } from "../types";

interface TextRendererProps {
  object: TextObject;
  onTextChange?: (text: string) => void;
  isEditing?: boolean;
}

export function TextRenderer({ object, onTextChange, isEditing }: TextRendererProps) {
  const { text, color = "#0f172a", fontSize = 16, fontWeight = "normal", fontStyle = "normal", textAlign = "left" } = object;

  if (isEditing) {
    return (
      <textarea
        autoFocus
        defaultValue={text}
        onChange={(e) => onTextChange?.(e.target.value)}
        className="w-full h-full bg-transparent resize-none border-none outline-none p-1 font-sans"
        style={{
          color,
          fontSize: `${fontSize}px`,
          fontWeight,
          fontStyle,
          textAlign,
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full p-1 select-none font-sans break-words whitespace-pre-wrap flex items-center"
      style={{
        color,
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        textAlign,
        justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
      }}
    >
      {text || <span className="opacity-40 italic">Type text...</span>}
    </div>
  );
}
