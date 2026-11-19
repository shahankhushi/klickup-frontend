"use client";

import { Plus, X, Trash2, Edit2, Check, FolderKanban, Clock } from "lucide-react";
import { useState } from "react";

export interface WhiteboardSummary {
  id: string;
  name: string;
  updatedAt: string;
  objectCount?: number;
}

interface WhiteboardManagerModalProps {
  open: boolean;
  onClose: () => void;
  whiteboards: WhiteboardSummary[];
  currentWhiteboardId: string;
  onSelectWhiteboard: (id: string) => void;
  onCreateNewWhiteboard: (name: string) => void;
  onRenameWhiteboard: (id: string, newName: string) => void;
  onDeleteWhiteboard: (id: string) => void;
}

export function WhiteboardManagerModal({
  open,
  onClose,
  whiteboards,
  currentWhiteboardId,
  onSelectWhiteboard,
  onCreateNewWhiteboard,
  onRenameWhiteboard,
  onDeleteWhiteboard,
}: WhiteboardManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!open) return null;

  const handleStartRename = (board: WhiteboardSummary) => {
    setEditingId(board.id);
    setEditingName(board.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameWhiteboard(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBoardName.trim() || `Whiteboard ${whiteboards.length + 1}`;
    onCreateNewWhiteboard(name);
    setNewBoardName("");
    setIsCreating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <FolderKanban className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Whiteboards Library</h3>
              <p className="text-[11px] text-slate-400">Manage, create and switch between whiteboards</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar: + New Whiteboard */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {whiteboards.length} {whiteboards.length === 1 ? "Whiteboard" : "Whiteboards"}
          </span>

          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Whiteboard</span>
            </button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5 flex-1 max-w-xs ml-3">
              <input
                autoFocus
                type="text"
                placeholder="Whiteboard name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-primary rounded-md outline-none bg-white"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* List of Whiteboards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {whiteboards.map((board) => {
            const isCurrent = board.id === currentWhiteboardId;
            const isEditing = editingId === board.id;

            return (
              <div
                key={board.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80"
                }`}
              >
                {/* Board Info / Click to Open */}
                <div
                  className="flex-1 min-w-0 pr-3 cursor-pointer"
                  onClick={() => {
                    if (!isEditing) {
                      onSelectWhiteboard(board.id);
                      onClose();
                    }
                  }}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(board.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="px-2 py-0.5 text-xs font-semibold text-slate-800 border border-primary rounded outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(board.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs truncate hover:text-primary transition-colors">
                        {board.name}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-primary text-white">
                          Active
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                    </span>
                    {board.objectCount !== undefined && (
                      <span>{board.objectCount} items</span>
                    )}
                  </div>
                </div>

                {/* Actions (Rename, Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(board);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {whiteboards.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${board.name}"?`)) {
                          onDeleteWhiteboard(board.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete whiteboard"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
