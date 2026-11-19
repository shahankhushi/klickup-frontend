"use client";

import { ShapeType } from "./types";
import { getShapeSvgPath } from "./math";
import { X } from "lucide-react";

interface ShapePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectShape: (shape: ShapeType) => void;
  currentShape: ShapeType;
}

interface ShapeItem {
  type: ShapeType;
  label: string;
}

const BASIC_SHAPES: ShapeItem[] = [
  { type: "rectangle", label: "Rectangle" },
  { type: "rounded-rect", label: "Rounded Rect" },
  { type: "circle", label: "Circle" },
  { type: "ellipse", label: "Ellipse" },
  { type: "triangle", label: "Triangle" },
  { type: "right-triangle", label: "Right Triangle" },
  { type: "diamond", label: "Diamond" },
  { type: "pentagon", label: "Pentagon" },
  { type: "hexagon", label: "Hexagon" },
  { type: "octagon", label: "Octagon" },
  { type: "parallelogram", label: "Parallelogram" },
  { type: "trapezoid", label: "Trapezoid" },
  { type: "star", label: "Star" },
  { type: "heart", label: "Heart" },
  { type: "speech-bubble", label: "Speech Bubble" },
  { type: "cloud", label: "Cloud" },
];

const FLOWCHART_SHAPES: ShapeItem[] = [
  { type: "process", label: "Process" },
  { type: "decision", label: "Decision" },
  { type: "start-end", label: "Start / End" },
  { type: "input-output", label: "Input / Output" },
  { type: "document", label: "Document" },
  { type: "database", label: "Database" },
];

const ARROW_SHAPES: ShapeItem[] = [
  { type: "arrow-right", label: "Right Arrow" },
  { type: "arrow-left", label: "Left Arrow" },
  { type: "arrow-up", label: "Up Arrow" },
  { type: "arrow-down", label: "Down Arrow" },
];

const DIAGRAM_SHAPES: ShapeItem[] = [
  { type: "cylinder", label: "Cylinder" },
  { type: "callout", label: "Callout" },
];

export function ShapePickerModal({ open, onClose, onSelectShape, currentShape }: ShapePickerModalProps) {
  if (!open) return null;

  const renderShapeGrid = (shapes: ShapeItem[]) => (
    <div className="grid grid-cols-4 gap-2">
      {shapes.map((item) => {
        const isSelected = item.type === currentShape;
        const path = getShapeSvgPath(item.type, 28, 28);

        return (
          <button
            key={item.type}
            type="button"
            onClick={() => {
              onSelectShape(item.type);
              onClose();
            }}
            title={item.label}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-xs"
                : "border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" className="overflow-visible">
              <path
                d={path}
                fill={isSelected ? "currentColor" : "none"}
                fillOpacity={isSelected ? 0.15 : 0}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] mt-1.5 truncate max-w-[65px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Shapes Library</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Basic Shapes</h4>
            {renderShapeGrid(BASIC_SHAPES)}
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Flowchart</h4>
            {renderShapeGrid(FLOWCHART_SHAPES)}
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Arrows</h4>
            {renderShapeGrid(ARROW_SHAPES)}
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Diagram Elements</h4>
            {renderShapeGrid(DIAGRAM_SHAPES)}
          </div>
        </div>
      </div>
    </div>
  );
}
