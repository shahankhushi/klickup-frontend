"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CanvasObject, CanvasTool, ConnectorType, DrawingToolType, Point, ShapeType } from "./types";
import { initialWhiteboardObjects } from "./seedData";
import { useWhiteboardHistory } from "./useWhiteboardHistory";
import { WhiteboardHeader } from "./WhiteboardHeader";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import { ZoomControls } from "./ZoomControls";
import { ShapePickerModal } from "./ShapePickerModal";
import { StickyColorPicker } from "./StickyColorPicker";
import { TaskPickerModal } from "./TaskPickerModal";
import { WhiteboardManagerModal, WhiteboardSummary } from "./WhiteboardManagerModal";
import { WhiteboardListView } from "./WhiteboardListView";
import { Task } from "@/lib/types";

const LOCAL_STORAGE_LIST_KEY = "klickup_whiteboards_registry_v1";
const API_URL = "http://localhost:5000/api/whiteboards";

interface WhiteboardEntity {
  id: string;
  name: string;
  data: string;
  updatedAt: string;
}

const DEFAULT_BOARD: WhiteboardEntity = {
  id: "wb_default_1",
  name: "testingbyshahan",
  data: JSON.stringify(initialWhiteboardObjects),
  updatedAt: new Date().toISOString(),
};

export function WhiteboardPage() {
  const [pageView, setPageView] = useState<"list" | "canvas">("list");
  const [whiteboards, setWhiteboards] = useState<WhiteboardEntity[]>([DEFAULT_BOARD]);
  const [currentBoardId, setCurrentBoardId] = useState<string>(DEFAULT_BOARD.id);
  const [title, setTitle] = useState(DEFAULT_BOARD.name);

  const [zoom, setZoom] = useState(0.86);
  const [pan, setPan] = useState<Point>({ x: 80, y: 30 });
  const [selectedIds, setSelectedIds] = useState<string[]>(["obj_rect_1"]);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");

  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>("rectangle");
  const [selectedStickyColor, setSelectedStickyColor] = useState<string>("#fde047");
  const [selectedConnectorType] = useState<ConnectorType>("elbow");
  const [drawToolType, setDrawToolType] = useState<DrawingToolType>("pen");
  const [penColor, setPenColor] = useState<string>("#1e293b");
  const [penWidth, setPenWidth] = useState<number>(3);

  const [shapePickerOpen, setShapePickerOpen] = useState(false);
  const [stickyColorPickerOpen, setStickyColorPickerOpen] = useState(false);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const {
    state: objects,
    pushState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWhiteboardHistory(initialWhiteboardObjects);

  // 1. Fetch whiteboards from backend API on mount
  const loadWhiteboards = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setWhiteboards(json.data);
          try {
            localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(json.data));
          } catch {}
          return json.data;
        }
      }
    } catch {
      // Backend unavailable, fallback to localStorage
    }

    // LocalStorage fallback
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_LIST_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWhiteboards(parsed);
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    return null;
  }, []);

  useEffect(() => {
    async function init() {
      const data = await loadWhiteboards();
      if (data && data.length > 0) {
        const first = data[0];
        setCurrentBoardId(first.id);
        setTitle(first.name);
        try {
          const parsed = JSON.parse(first.data);
          if (Array.isArray(parsed)) setState(parsed);
        } catch {}
      } else {
        // Initial seed to backend
        try {
          await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: DEFAULT_BOARD.id,
              name: DEFAULT_BOARD.name,
              data: DEFAULT_BOARD.data,
            }),
          });
          setWhiteboards([DEFAULT_BOARD]);
          setCurrentBoardId(DEFAULT_BOARD.id);
          setTitle(DEFAULT_BOARD.name);
        } catch {}
      }
    }

    init();

    const handleReset = () => {
      setPageView("list");
      void loadWhiteboards();
    };
    window.addEventListener("klickup_reset_whiteboard_view", handleReset);
    return () => window.removeEventListener("klickup_reset_whiteboard_view", handleReset);
  }, [loadWhiteboards, setState]);

  // 2. Debounced Autosave to Backend & LocalStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const persistWhiteboard = useCallback(
    async (boardId: string, currentObjects: CanvasObject[], boardTitle: string) => {
      setSaveStatus("saving");
      const serialized = JSON.stringify(currentObjects);

      // Save to localStorage and state
      setWhiteboards((prev) => {
        const updated = prev.map((b) =>
          b.id === boardId
            ? { ...b, name: boardTitle, data: serialized, updatedAt: new Date().toISOString() }
            : b
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Save to Backend API via PATCH (backend upserts this exact boardId)
      try {
        const res = await fetch(`${API_URL}/${boardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: boardTitle,
            data: serialized,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
        } else {
          // Handled locally
          setSaveStatus("saved");
        }
      } catch {
        // Saved locally even if network is offline
        setSaveStatus("saved");
      }
    },
    []
  );

  const handleUpdateObjects = useCallback(
    (newObjects: CanvasObject[]) => {
      pushState(newObjects);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        persistWhiteboard(currentBoardId, newObjects, title);
      }, 600);
    },
    [currentBoardId, persistWhiteboard, pushState, title]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    persistWhiteboard(currentBoardId, objects, newTitle);
  };

  // 3. Switch Whiteboard
  const handleSelectWhiteboard = (id: string) => {
    const target = whiteboards.find((b) => b.id === id);
    if (!target) return;

    setCurrentBoardId(target.id);
    setTitle(target.name);
    setSelectedIds([]);
    try {
      const parsed = JSON.parse(target.data);
      if (Array.isArray(parsed)) {
        setState(parsed);
      } else {
        setState([]);
      }
    } catch {
      setState([]);
    }
  };

  // 4. Create New Whiteboard (Blank or with starter shape)
  const handleCreateNewWhiteboard = async (name: string, isBlank: boolean = true) => {
    const newBoardId = `wb_${Date.now()}`;
    const starterObjects: CanvasObject[] = isBlank
      ? []
      : [
          {
            id: `obj_shape_${Date.now()}`,
            type: "shape",
            shapeType: "rounded-rect",
            x: 400,
            y: 250,
            width: 180,
            height: 100,
            fill: "#ffffff",
            stroke: "#3b82f6",
            strokeWidth: 2,
            strokeStyle: "solid",
            text: name,
            textColor: "#1e293b",
            fontWeight: "bold",
            fontSize: 16,
            zIndex: 1,
          },
        ];

    const newBoard: WhiteboardEntity = {
      id: newBoardId,
      name,
      data: JSON.stringify(starterObjects),
      updatedAt: new Date().toISOString(),
    };

    setWhiteboards((prev) => [newBoard, ...prev]);
    setCurrentBoardId(newBoardId);
    setTitle(name);
    setState(starterObjects);
    setSelectedIds(starterObjects.length > 0 ? [starterObjects[0].id] : []);
    setPageView("canvas"); // Instantly transition to blank canvas!

    // Persist to backend with newBoardId
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newBoardId,
          name,
          data: JSON.stringify(starterObjects),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const realId = json.data?.id || newBoardId;
        if (realId !== newBoardId) {
          setCurrentBoardId(realId);
          setWhiteboards((prev) => {
            const updated = prev.map((b) => (b.id === newBoardId ? { ...b, id: realId } : b));
            try {
              localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    } catch {
      // offline save in state/localStorage
    }
  };

  // 5. Duplicate Whiteboard
  const handleDuplicateWhiteboard = async (id: string) => {
    const source = whiteboards.find((b) => b.id === id);
    if (!source) return;

    const newName = `${source.name} (Copy)`;
    const newBoardId = `wb_${Date.now()}`;
    const newBoard: WhiteboardEntity = {
      id: newBoardId,
      name: newName,
      data: source.data,
      updatedAt: new Date().toISOString(),
    };

    setWhiteboards((prev) => {
      const updated = [newBoard, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newBoardId,
          name: newName,
          data: source.data,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const realId = json.data?.id || newBoardId;
        if (realId !== newBoardId) {
          setWhiteboards((prev) => {
            const updated = prev.map((b) => (b.id === newBoardId ? { ...b, id: realId } : b));
            try {
              localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // 5. Rename Whiteboard
  const handleRenameWhiteboard = async (id: string, newName: string) => {
    setWhiteboards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, name: newName, updatedAt: new Date().toISOString() } : b))
    );

    if (id === currentBoardId) {
      setTitle(newName);
    }

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
    } catch {
      // ignore
    }
  };

  // 6. Delete Whiteboard
  const handleDeleteWhiteboard = async (id: string) => {
    const remaining = whiteboards.filter((b) => b.id !== id);
    if (remaining.length === 0) return;

    setWhiteboards(remaining);

    // If current deleted, switch to first remaining
    if (id === currentBoardId) {
      const nextBoard = remaining[0];
      handleSelectWhiteboard(nextBoard.id);
    }

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  };

  // Insert real task from task picker
  const handleSelectTask = (task: Task, projectName: string) => {
    const newTaskCard: CanvasObject = {
      id: `obj_task_${Date.now()}`,
      type: "task",
      taskId: task.id,
      taskTitle: task.title,
      projectName,
      spaceName: "Khushi Motors",
      status: task.status,
      priority: task.priority,
      assigneeName: "Abdul Rehman",
      assigneeInitials: "AM",
      assigneeColor: "#a88365",
      x: 400 + Math.random() * 80,
      y: 400 + Math.random() * 80,
      width: 220,
      height: 90,
      zIndex: objects.length + 1,
    };

    handleUpdateObjects([...objects, newTaskCard]);
    setSelectedIds([newTaskCard.id]);
    setActiveTool("select");
  };

  // Image Upload handler
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const newImg: CanvasObject = {
        id: `obj_img_${Date.now()}`,
        type: "image",
        x: 700,
        y: 300,
        width: 320,
        height: 200,
        src: dataUrl,
        caption: file.name,
        zIndex: objects.length + 1,
      };

      handleUpdateObjects([...objects, newImg]);
      setSelectedIds([newImg.id]);
      setActiveTool("select");
    };
    reader.readAsDataURL(file);
  };

  // Insert Frame Container
  const handleInsertFrame = () => {
    const newFrame: CanvasObject = {
      id: `obj_frame_${Date.now()}`,
      type: "frame",
      title: "Sprint Frame",
      x: 300,
      y: 200,
      width: 450,
      height: 320,
      stroke: "#94a3b8",
      fill: "rgba(255, 255, 255, 0.5)",
      zIndex: 0,
    };

    handleUpdateObjects([newFrame, ...objects]);
    setSelectedIds([newFrame.id]);
    setActiveTool("select");
  };

  // Insert Mindmap / Flow Template
  const handleInsertMindmap = () => {
    const now = Date.now();
    const rootId = `obj_mm_root_${now}`;
    const child1Id = `obj_mm_c1_${now}`;
    const child2Id = `obj_mm_c2_${now}`;

    const root: CanvasObject = {
      id: rootId,
      type: "shape",
      shapeType: "rounded-rect",
      x: 500,
      y: 300,
      width: 150,
      height: 60,
      fill: "#e0e7ff",
      stroke: "#6366f1",
      strokeWidth: 2,
      strokeStyle: "solid",
      text: "Main Concept",
      textColor: "#3730a3",
      fontWeight: "bold",
      zIndex: objects.length + 1,
    };

    const child1: CanvasObject = {
      id: child1Id,
      type: "shape",
      shapeType: "rectangle",
      x: 720,
      y: 230,
      width: 140,
      height: 50,
      fill: "#ecfdf5",
      stroke: "#10b981",
      strokeWidth: 2,
      strokeStyle: "solid",
      text: "Branch A",
      textColor: "#065f46",
      zIndex: objects.length + 2,
    };

    const child2: CanvasObject = {
      id: child2Id,
      type: "shape",
      shapeType: "rectangle",
      x: 720,
      y: 370,
      width: 140,
      height: 50,
      fill: "#fef3c7",
      stroke: "#f59e0b",
      strokeWidth: 2,
      strokeStyle: "solid",
      text: "Branch B",
      textColor: "#92400e",
      zIndex: objects.length + 3,
    };

    const conn1: CanvasObject = {
      id: `obj_conn_${now}_1`,
      type: "connector",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fromId: rootId,
      fromAnchor: "right",
      toId: child1Id,
      toAnchor: "left",
      connectorType: "curved",
      strokeStyle: "solid",
      stroke: "#6366f1",
      strokeWidth: 2,
      endArrow: "arrow",
      zIndex: objects.length + 4,
    };

    const conn2: CanvasObject = {
      id: `obj_conn_${now}_2`,
      type: "connector",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fromId: rootId,
      fromAnchor: "right",
      toId: child2Id,
      toAnchor: "left",
      connectorType: "curved",
      strokeStyle: "solid",
      stroke: "#6366f1",
      strokeWidth: 2,
      endArrow: "arrow",
      zIndex: objects.length + 5,
    };

    handleUpdateObjects([...objects, root, child1, child2, conn1, conn2]);
    setSelectedIds([rootId]);
    setActiveTool("select");
  };

  const handleFitView = () => {
    setZoom(0.86);
    setPan({ x: 80, y: 30 });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(3.0, z + 0.15));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.2, z - 0.15));
  };

  const whiteboardSummaries: WhiteboardSummary[] = whiteboards.map((b) => {
    let count = 0;
    try {
      const parsed = JSON.parse(b.data);
      if (Array.isArray(parsed)) count = parsed.length;
    } catch {
      // ignore
    }
    return {
      id: b.id,
      name: b.name,
      updatedAt: b.updatedAt,
      objectCount: count,
    };
  });

  if (pageView === "list") {
    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden bg-white">
        <WhiteboardListView
          whiteboards={whiteboards}
          onOpenBoard={(id) => {
            handleSelectWhiteboard(id);
            setPageView("canvas");
          }}
          onCreateNewBoard={(name, isBlank) => {
            handleCreateNewWhiteboard(name, isBlank);
          }}
          onRenameBoard={handleRenameWhiteboard}
          onDeleteBoard={handleDeleteWhiteboard}
          onDuplicateBoard={handleDuplicateWhiteboard}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-white">
      {/* Top Header */}
      <WhiteboardHeader
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        onOpenManager={() => setManagerModalOpen(true)}
        whiteboardCount={whiteboards.length}
        onBackToList={() => {
          setPageView("list");
          void loadWhiteboards();
        }}
        onShare={() => {
          navigator.clipboard.writeText(window.location.href);
          alert("Whiteboard link copied to clipboard!");
        }}
      />

      {/* Main Infinite Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <WhiteboardCanvas
          objects={objects}
          zoom={zoom}
          pan={pan}
          activeTool={activeTool}
          selectedIds={selectedIds}
          selectedShapeType={selectedShapeType}
          selectedStickyColor={selectedStickyColor}
          selectedConnectorType={selectedConnectorType}
          drawToolType={drawToolType}
          penColor={penColor}
          penWidth={penWidth}
          onUpdateObjects={handleUpdateObjects}
          onSelectObjects={setSelectedIds}
          onPanChange={setPan}
          onZoomChange={setZoom}
          onSelectTool={setActiveTool}
          onUndo={undo}
          onRedo={redo}
        />

        {/* Bottom Left Zoom Controls (Matching Screenshot 86%) */}
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitView={handleFitView}
        />

        {/* Floating Bottom Toolbar */}
        <WhiteboardToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenShapePicker={() => setShapePickerOpen(true)}
          onOpenStickyColorPicker={() => setStickyColorPickerOpen(!stickyColorPickerOpen)}
          onOpenTaskPicker={() => setTaskPickerOpen(true)}
          onImageUpload={handleImageUpload}
          onInsertFrame={handleInsertFrame}
          onInsertMindmap={handleInsertMindmap}
          selectedShapeType={selectedShapeType}
          selectedStickyColor={selectedStickyColor}
          selectedConnectorType={selectedConnectorType}
          drawToolType={drawToolType}
          onSelectDrawTool={setDrawToolType}
          penColor={penColor}
          onChangePenColor={setPenColor}
          penWidth={penWidth}
          onChangePenWidth={setPenWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />

        {/* Sticky Note Pastel Color Picker Popover */}
        <StickyColorPicker
          open={stickyColorPickerOpen}
          onClose={() => setStickyColorPickerOpen(false)}
          onSelectColor={(color) => {
            setSelectedStickyColor(color);
            setActiveTool("sticky");
          }}
          currentColor={selectedStickyColor}
        />
      </div>

      {/* Whiteboards Manager / Switcher Modal */}
      <WhiteboardManagerModal
        open={managerModalOpen}
        onClose={() => setManagerModalOpen(false)}
        whiteboards={whiteboardSummaries}
        currentWhiteboardId={currentBoardId}
        onSelectWhiteboard={handleSelectWhiteboard}
        onCreateNewWhiteboard={handleCreateNewWhiteboard}
        onRenameWhiteboard={handleRenameWhiteboard}
        onDeleteWhiteboard={handleDeleteWhiteboard}
      />

      {/* Shape Library Modal */}
      <ShapePickerModal
        open={shapePickerOpen}
        onClose={() => setShapePickerOpen(false)}
        onSelectShape={(shape) => {
          setSelectedShapeType(shape);
          setActiveTool("shape");
        }}
        currentShape={selectedShapeType}
      />

      {/* Task Picker Modal */}
      <TaskPickerModal
        open={taskPickerOpen}
        onClose={() => setTaskPickerOpen(false)}
        onSelectTask={handleSelectTask}
      />
    </div>
  );
}
