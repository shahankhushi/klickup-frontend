"use client";

import { ShapeObject } from "../types";
import { getShapeSvgPath } from "../math";

interface ShapeRendererProps {
  object: ShapeObject;
  onTextChange?: (text: string) => void;
  isEditing?: boolean;
}

export function ShapeRenderer({ object, onTextChange, isEditing }: ShapeRendererProps) {
  const { width, height, shapeType, fill, stroke, strokeWidth, strokeStyle, text, textColor, fontSize, fontWeight, fontStyle = "normal", textAlign } = object;

  const svgPath = getShapeSvgPath(shapeType, width, height);

  let strokeDasharray: string | undefined;
  if (strokeStyle === "dashed") {
    strokeDasharray = "6 4";
  } else if (strokeStyle === "dotted") {
    strokeDasharray = "2 4";
  }

  return (
    <div className="relative w-full h-full select-none">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <path
          d={svgPath}
          fill={fill || "none"}
          stroke={stroke || "#0f172a"}
          strokeWidth={strokeWidth || 2}
          strokeDasharray={strokeDasharray}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {/* Embedded text inside shape */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none"
        style={{
          color: textColor || "#0f172a",
          fontSize: `${fontSize || 14}px`,
          fontWeight: fontWeight || "normal",
          fontStyle,
          textAlign: textAlign || "center",
        }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={text || ""}
            onChange={(e) => onTextChange?.(e.target.value)}
            className="w-full h-full bg-transparent resize-none border-none outline-none pointer-events-auto text-center"
            style={{
              color: textColor || "#0f172a",
              fontSize: `${fontSize || 14}px`,
              fontWeight: fontWeight || "normal",
              fontStyle,
              textAlign: textAlign || "center",
            }}
          />
        ) : (
          <span className="break-words whitespace-pre-wrap">{text}</span>
        )}
      </div>
    </div>
  );
}
