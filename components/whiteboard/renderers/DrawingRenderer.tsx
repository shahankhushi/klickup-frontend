"use client";

import { DrawingObject } from "../types";

interface DrawingRendererProps {
  object: DrawingObject;
}

export function DrawingRenderer({ object }: DrawingRendererProps) {
  const { points, color = "#1e293b", strokeWidth = 3 } = object;

  if (!points || points.length === 0) return null;

  // Build SVG path string from points
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return (
    <svg className="w-full h-full overflow-visible pointer-events-none select-none">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
