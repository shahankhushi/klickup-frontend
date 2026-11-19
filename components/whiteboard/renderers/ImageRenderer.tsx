"use client";

import { ImageObject } from "../types";

interface ImageRendererProps {
  object: ImageObject;
}

export function ImageRenderer({ object }: ImageRendererProps) {
  const { src, caption } = object;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200/80 shadow-md bg-white flex flex-col select-none">
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption || "Whiteboard Image"}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
      {caption && (
        <div className="px-2 py-1 bg-white text-[11px] text-slate-500 font-medium truncate border-t border-slate-100">
          {caption}
        </div>
      )}
    </div>
  );
}
