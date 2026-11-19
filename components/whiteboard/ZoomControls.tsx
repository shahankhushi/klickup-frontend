"use client";

import { Maximize2, Minus, Plus } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onResetZoom, onFitView }: ZoomControlsProps) {
  const percentage = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-6 left-6 z-30 flex items-center bg-white/95 backdrop-blur-xs rounded-xl shadow-lg border border-slate-200/80 p-1 text-slate-600 select-none">
      <button
        type="button"
        onClick={onFitView}
        title="Fit to screen"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <div className="h-3 w-px bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom out (Ctrl + -)"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onResetZoom}
        title="Click to reset zoom to 100%"
        className="px-2 py-1 text-xs font-semibold hover:bg-slate-100 rounded-md transition-colors min-w-[42px] text-center"
      >
        {percentage}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom in (Ctrl + +)"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
