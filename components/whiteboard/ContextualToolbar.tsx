"use client";

import { CanvasObject, LineStyle } from "./types";
import { PALETTE_COLORS } from "./math";
import {
  Bold,
  Italic,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Type,
} from "lucide-react";
import { useState } from "react";

interface ContextualToolbarProps {
  selectedObject: CanvasObject;
  zoom: number;
  pan: { x: number; y: number };
  onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export function ContextualToolbar({
  selectedObject,
  zoom,
  pan,
  onUpdateObject,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}: ContextualToolbarProps) {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [borderMenuOpen, setBorderMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Position above the selected object in screen coordinates
  const screenX = selectedObject.x * zoom + pan.x;
  const screenY = selectedObject.y * zoom + pan.y - 52;

  const isShape = selectedObject.type === "shape";
  const isSticky = selectedObject.type === "sticky";
  const isText = selectedObject.type === "text";
  const isConnector = selectedObject.type === "connector";

  const currentFontSize = (selectedObject as { fontSize?: number }).fontSize || (isText || isSticky ? 16 : 14);
  const currentWeight = (selectedObject as { fontWeight?: string }).fontWeight || "normal";
  const currentStyle = (selectedObject as { fontStyle?: string }).fontStyle || "normal";
  const currentAlign = (selectedObject as { textAlign?: string }).textAlign || "center";

  return (
    <div
      className="contextual-toolbar absolute z-40 flex items-center gap-1 bg-white rounded-xl shadow-xl border border-slate-200/90 px-2 py-1 select-none pointer-events-auto"
      style={{
        left: `${screenX}px`,
        top: `${Math.max(10, screenY)}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Shape / Object Type Indicator */}
      {isShape && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
          <span className="capitalize">{selectedObject.shapeType}</span>
        </div>
      )}

      {/* Connector type switcher */}
      {isConnector && (
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          {(["elbow", "straight", "curved"] as const).map((cType) => (
            <button
              key={cType}
              type="button"
              onClick={() => onUpdateObject(selectedObject.id, { connectorType: cType })}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded capitalize transition-colors ${
                (selectedObject as { connectorType?: string }).connectorType === cType
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cType}
            </button>
          ))}
        </div>
      )}

      {/* 2. Task badge / conversion */}
      {isShape && (
        <button
          type="button"
          onClick={() => {
            onUpdateObject(selectedObject.id, { text: selectedObject.text ? `[Task] ${selectedObject.text}` : "[Task] New Task" });
          }}
          className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-slate-100 text-xs text-slate-600 transition-colors"
          title="Convert to Task"
        >
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium">Task</span>
        </button>
      )}

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* 3. Text Formatting (Font Size, Bold, Italic, Alignment) */}
      {(isShape || isSticky || isText) && (
        <>
          {/* Font Size Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFontSizeMenuOpen(!fontSizeMenuOpen);
                setColorMenuOpen(false);
                setBorderMenuOpen(false);
              }}
              className="px-1.5 py-1 rounded hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-0.5"
              title="Font Size"
            >
              <Type className="h-3 w-3 text-slate-500" />
              <span>{currentFontSize}</span>
            </button>

            {fontSizeMenuOpen && (
              <div
                className="absolute top-8 left-0 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-1 flex flex-col gap-0.5 w-20"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {[12, 14, 16, 20, 24, 32].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      onUpdateObject(selectedObject.id, { fontSize: sz });
                      setFontSizeMenuOpen(false);
                    }}
                    className={`px-2 py-1 text-xs text-left rounded hover:bg-slate-100 transition-colors ${
                      currentFontSize === sz ? "font-bold text-primary bg-primary/10" : "text-slate-700"
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bold */}
          <button
            type="button"
            onClick={() => {
              onUpdateObject(selectedObject.id, {
                fontWeight: currentWeight === "bold" ? "normal" : "bold",
              });
            }}
            className={`p-1.5 rounded transition-colors ${
              currentWeight === "bold"
                ? "bg-slate-200 text-slate-900 font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => {
              onUpdateObject(selectedObject.id, {
                fontStyle: currentStyle === "italic" ? "normal" : "italic",
              });
            }}
            className={`p-1.5 rounded transition-colors ${
              currentStyle === "italic"
                ? "bg-slate-200 text-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => {
              const aligns = ["left", "center", "right"] as const;
              const nextAlign = aligns[(aligns.indexOf(currentAlign as typeof aligns[number]) + 1) % aligns.length];
              onUpdateObject(selectedObject.id, { textAlign: nextAlign });
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title={`Text Alignment: ${currentAlign}`}
          >
            {currentAlign === "left" ? (
              <AlignLeft className="h-3.5 w-3.5" />
            ) : currentAlign === "right" ? (
              <AlignRight className="h-3.5 w-3.5" />
            ) : (
              <AlignCenter className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />
        </>
      )}

      {/* 4. Color Picker (Shape, Sticky, Connector, Text) */}
      {(isShape || isSticky || isConnector || isText) && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColorMenuOpen(!colorMenuOpen);
              setBorderMenuOpen(false);
              setFontSizeMenuOpen(false);
              setMoreMenuOpen(false);
            }}
            className="p-1 rounded hover:bg-slate-100 flex items-center gap-1"
            title="Color"
          >
            <span
              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
              style={{
                backgroundColor: isConnector
                  ? (selectedObject as { stroke?: string }).stroke || "#0f172a"
                  : isText
                  ? (selectedObject as { color?: string }).color || "#0f172a"
                  : isShape
                  ? (selectedObject as { fill?: string }).fill || "#ffffff"
                  : (selectedObject as { color?: string }).color || "#fde047",
              }}
            />
          </button>

          {colorMenuOpen && (
            <div
              className="absolute top-8 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 grid grid-cols-4 gap-1.5 w-36"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {PALETTE_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    if (isConnector) onUpdateObject(selectedObject.id, { stroke: col });
                    if (isText) onUpdateObject(selectedObject.id, { color: col });
                    if (isShape) onUpdateObject(selectedObject.id, { fill: col, textColor: col === "#ffffff" ? "#0f172a" : undefined });
                    if (isSticky) onUpdateObject(selectedObject.id, { color: col });
                    setColorMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Border style & thickness (solid, dashed, dotted) */}
      {(isShape || isConnector) && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBorderMenuOpen(!borderMenuOpen);
              setColorMenuOpen(false);
              setMoreMenuOpen(false);
            }}
            className="px-1.5 py-1 rounded hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1"
            title="Border style"
          >
            <span className="w-3.5 h-3.5 border-2 border-slate-700 border-dashed rounded-xs" />
          </button>

          {borderMenuOpen && (
            <div
              className="absolute top-8 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex flex-col gap-1 w-32"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase">Style</span>
              {(["solid", "dashed", "dotted"] as LineStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    onUpdateObject(selectedObject.id, { strokeStyle: style });
                    setBorderMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-xs text-slate-700 capitalize"
                >
                  <span className={`w-10 border-t-2 border-slate-700 border-${style}`} />
                  <span>{style}</span>
                </button>
              ))}

              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Width</span>
              <div className="flex gap-1">
                {[1, 2, 4, 6].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      onUpdateObject(selectedObject.id, { strokeWidth: w });
                      setBorderMenuOpen(false);
                    }}
                    className="flex-1 py-1 rounded border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-center"
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Duplicate */}
      <button
        type="button"
        onClick={() => onDuplicate(selectedObject.id)}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
        title="Duplicate (Ctrl+D)"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>

      {/* 7. Delete */}
      <button
        type="button"
        onClick={() => onDelete(selectedObject.id)}
        className="p-1.5 rounded hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
        title="Delete (Backspace / Del)"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* 8. Three-dots more options */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setMoreMenuOpen(!moreMenuOpen);
            setColorMenuOpen(false);
            setBorderMenuOpen(false);
          }}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
          title="More options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {moreMenuOpen && (
          <div
            className="absolute top-8 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1 flex flex-col gap-0.5 w-40"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                onBringToFront(selectedObject.id);
                setMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-xs text-slate-700"
            >
              <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
              <span>Bring to front</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSendToBack(selectedObject.id);
                setMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-xs text-slate-700"
            >
              <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
              <span>Send to back</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                onDelete(selectedObject.id);
                setMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-50 text-xs text-red-600 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete object</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
