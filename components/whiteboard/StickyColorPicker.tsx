"use client";

import { PASTEL_COLORS } from "./math";

interface StickyColorPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  currentColor: string;
}

export function StickyColorPicker({ open, onClose, onSelectColor, currentColor }: StickyColorPickerProps) {
  if (!open) return null;

  return (
    <div
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {PASTEL_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => {
            onSelectColor(c.value);
            onClose();
          }}
          title={c.name}
          className={`w-7 h-7 rounded-lg border transition-transform hover:scale-110 ${
            currentColor === c.value ? "ring-2 ring-primary ring-offset-1 scale-105" : ""
          }`}
          style={{ backgroundColor: c.value, borderColor: c.border }}
        />
      ))}
    </div>
  );
}
