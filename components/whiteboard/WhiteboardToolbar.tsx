"use client";

import { CanvasTool, ConnectorType, DrawingToolType, ShapeType } from "./types";
import {
  MousePointer2,
  Hand,
  CheckCircle2,
  PenTool,
  Pencil,
  Highlighter,
  Square,
  StickyNote,
  Type,
  Layout,
  Image as ImageIcon,
  GitBranch,
  Undo2,
  Redo2,
  ChevronUp,
} from "lucide-react";
import { useRef, useState } from "react";

interface WhiteboardToolbarProps {
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  onOpenShapePicker: () => void;
  onOpenStickyColorPicker: () => void;
  onOpenTaskPicker: () => void;
  onImageUpload: (file: File) => void;
  onInsertFrame: () => void;
  onInsertMindmap: () => void;
  selectedShapeType: ShapeType;
  selectedStickyColor: string;
  selectedConnectorType: ConnectorType;
  drawToolType?: DrawingToolType;
  onSelectDrawTool?: (tool: DrawingToolType) => void;
  penColor?: string;
  onChangePenColor?: (color: string) => void;
  penWidth?: number;
  onChangePenWidth?: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function WhiteboardToolbar({
  activeTool,
  onSelectTool,
  onOpenShapePicker,
  onOpenStickyColorPicker,
  onOpenTaskPicker,
  onImageUpload,
  onInsertFrame,
  onInsertMindmap,
  selectedShapeType,
  selectedStickyColor,
  drawToolType = "pen",
  onSelectDrawTool,
  penColor = "#1e293b",
  onChangePenColor,
  penWidth = 3,
  onChangePenWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: WhiteboardToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawMenuOpen, setDrawMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const penColors = ["#0f172a", "#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#d97706"];
  const highlighterColors = ["#facc15", "#4ade80", "#f472b6", "#38bdf8", "#fb923c"];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-200/90 text-slate-700">
        {/* 1. Select Tool (V) */}
        <button
          type="button"
          onClick={() => {
            onSelectTool("select");
            setDrawMenuOpen(false);
          }}
          title="Select (V)"
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all ${
            activeTool === "select"
              ? "bg-primary text-white shadow-sm"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <MousePointer2 className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 text-[8.5px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-0.5 pointer-events-none">
            V
          </span>
        </button>

        {/* 2. Hand / Pan Tool (H) */}
        <button
          type="button"
          onClick={() => {
            onSelectTool("hand");
            setDrawMenuOpen(false);
          }}
          title="Hand / Pan (H)"
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all ${
            activeTool === "hand"
              ? "bg-primary text-white shadow-sm"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <Hand className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 text-[8.5px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-0.5 pointer-events-none">
            H
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5" />

        {/* 3. Task Tool (opens task picker) */}
        <button
          type="button"
          onClick={onOpenTaskPicker}
          title="Insert Task Card"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            activeTool === "task"
              ? "border-primary bg-primary/10 text-primary shadow-xs"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span>Task</span>
        </button>

        {/* 4. Draw / Pencil / Pen / Highlighter Tool Suite */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              onSelectTool("draw");
              setDrawMenuOpen(!drawMenuOpen);
            }}
            title={`Drawing (${drawToolType.toUpperCase()}) - Click for options`}
            className={`relative p-2 rounded-xl flex items-center justify-center gap-0.5 transition-all ${
              activeTool === "draw"
                ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            {drawToolType === "highlighter" ? (
              <Highlighter className="h-4 w-4" />
            ) : drawToolType === "pencil" ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <PenTool className="h-4 w-4" />
            )}
            <ChevronUp className="h-3 w-3 opacity-60" />
            <span className="absolute -top-1 -right-1 text-[8.5px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-0.5 pointer-events-none">
              D
            </span>
          </button>

          {/* Drawing Tool Options Popover */}
          {drawMenuOpen && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 flex flex-col gap-2 w-52">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draw Tool</span>
              
              {/* Tool Mode: Pen, Pencil, Highlighter */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    onSelectDrawTool?.("pen");
                    onChangePenWidth?.(3);
                  }}
                  className={`flex flex-col items-center py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    drawToolType === "pen" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5 mb-0.5" />
                  <span>Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectDrawTool?.("pencil");
                    onChangePenWidth?.(1.5);
                  }}
                  className={`flex flex-col items-center py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    drawToolType === "pencil" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5 mb-0.5" />
                  <span>Pencil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectDrawTool?.("highlighter");
                    onChangePenWidth?.(18);
                    onChangePenColor?.("#facc15");
                  }}
                  className={`flex flex-col items-center py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    drawToolType === "highlighter" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Highlighter className="h-3.5 w-3.5 mb-0.5" />
                  <span>Highlight</span>
                </button>
              </div>

              {/* Color Presets */}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Colors</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(drawToolType === "highlighter" ? highlighterColors : penColors).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onChangePenColor?.(col)}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      penColor === col ? "scale-115 ring-2 ring-primary ring-offset-1 border-white" : "border-slate-300 hover:scale-110"
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              {/* Width Presets */}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Thickness</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Thin", w: drawToolType === "highlighter" ? 12 : drawToolType === "pencil" ? 1 : 2 },
                  { label: "Medium", w: drawToolType === "highlighter" ? 18 : drawToolType === "pencil" ? 2 : 3.5 },
                  { label: "Thick", w: drawToolType === "highlighter" ? 28 : drawToolType === "pencil" ? 3.5 : 6 },
                ].map((th) => (
                  <button
                    key={th.label}
                    type="button"
                    onClick={() => onChangePenWidth?.(th.w)}
                    className={`flex-1 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                      penWidth === th.w ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Shapes Tool with shape popup indicator */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              onSelectTool("shape");
              onOpenShapePicker();
              setDrawMenuOpen(false);
            }}
            title={`Shapes (Current: ${selectedShapeType})`}
            className={`p-2 rounded-xl flex items-center justify-center gap-0.5 transition-all ${
              activeTool === "shape"
                ? "bg-emerald-600 text-white shadow-sm"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Square className="h-4 w-4" />
            <ChevronUp className="h-3 w-3 opacity-60" />
          </button>
        </div>

        {/* 6. Sticky Notes Tool (N) with color indicator */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              onSelectTool("sticky");
              onOpenStickyColorPicker();
              setDrawMenuOpen(false);
            }}
            title="Sticky Note (N)"
            className={`relative p-2 rounded-xl flex items-center justify-center transition-all ${
              activeTool === "sticky"
                ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                : "hover:bg-amber-50 text-slate-700"
            }`}
          >
            <StickyNote
              className="h-4 w-4 transition-transform hover:scale-105"
              fill={activeTool === "sticky" ? "#fef08a" : (selectedStickyColor || "#fde047")}
              stroke={activeTool === "sticky" ? "#78350f" : "#b45309"}
              strokeWidth={1.75}
            />
            <span className="absolute -top-1 -right-1 text-[8.5px] font-bold text-slate-500 bg-white border border-slate-200 rounded px-0.5 pointer-events-none">
              N
            </span>
          </button>
        </div>

        {/* 7. Text Tool (T) */}
        <button
          type="button"
          onClick={() => {
            onSelectTool("text");
            setDrawMenuOpen(false);
          }}
          title="Text (T)"
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all ${
            activeTool === "text"
              ? "bg-primary text-white shadow-sm"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <Type className="h-4 w-4 font-bold" />
          <span className="absolute -top-1 -right-1 text-[8.5px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-0.5 pointer-events-none">
            T
          </span>
        </button>

        {/* 8. Frame Tool */}
        <button
          type="button"
          onClick={() => {
            onInsertFrame();
            setDrawMenuOpen(false);
          }}
          title="Insert Frame"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Layout className="h-4 w-4" />
        </button>

        {/* 9. Image Upload Tool */}
        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.click();
            setDrawMenuOpen(false);
          }}
          title="Upload Image"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 10. Mindmap / Diagram Tool */}
        <button
          type="button"
          onClick={() => {
            onInsertMindmap();
            setDrawMenuOpen(false);
          }}
          title="Insert Mind Map Node"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <GitBranch className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5" />

        {/* 11. Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-2 rounded-xl transition-colors ${
            canUndo ? "hover:bg-slate-100 text-slate-700" : "text-slate-300 cursor-not-allowed"
          }`}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* 12. Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-2 rounded-xl transition-colors ${
            canRedo ? "hover:bg-slate-100 text-slate-700" : "text-slate-300 cursor-not-allowed"
          }`}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
