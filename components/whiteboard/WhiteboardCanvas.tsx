"use client";

import {
  CanvasObject,
  CanvasTool,
  ConnectorType,
  Point,
  SelectionBox,
  ShapeType,
  AnchorPosition,
  DrawingToolType,
} from "./types";
import { screenToCanvas, getAnchorPoint, getClosestAnchor } from "./math";
import { ShapeRenderer } from "./renderers/ShapeRenderer";
import { StickyNoteRenderer } from "./renderers/StickyNoteRenderer";
import { TextRenderer } from "./renderers/TextRenderer";
import { TaskCardRenderer } from "./renderers/TaskCardRenderer";
import { ImageRenderer } from "./renderers/ImageRenderer";
import { FrameRenderer } from "./renderers/FrameRenderer";
import { ConnectorRenderer } from "./renderers/ConnectorRenderer";
import { ContextualToolbar } from "./ContextualToolbar";
import { useCallback, useEffect, useState } from "react";

let idCounter = 1000;
function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

function getCanvasRect(e?: React.SyntheticEvent) {
  if (e) {
    const el = e.currentTarget as HTMLElement | null;
    if (el) {
      const container = el.classList?.contains("canvas-container") ? el : el.closest(".canvas-container");
      if (container) return container.getBoundingClientRect();
    }
  }
  if (typeof document !== "undefined") {
    return document.querySelector(".canvas-container")?.getBoundingClientRect() ?? null;
  }
  return null;
}

interface WhiteboardCanvasProps {
  objects: CanvasObject[];
  zoom: number;
  pan: Point;
  activeTool: CanvasTool;
  selectedIds: string[];
  selectedShapeType: ShapeType;
  selectedStickyColor: string;
  selectedConnectorType: ConnectorType;
  drawToolType?: DrawingToolType;
  penColor: string;
  penWidth: number;
  onUpdateObjects: (objects: CanvasObject[]) => void;
  onSelectObjects: (ids: string[]) => void;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onUndo: () => void;
  onRedo: () => void;
}

type DragMode =
  | "none"
  | "pan"
  | "move"
  | "resize"
  | "draw"
  | "create_shape"
  | "marquee"
  | "connect";

export function WhiteboardCanvas({
  objects,
  zoom,
  pan,
  activeTool,
  selectedIds,
  selectedShapeType,
  selectedStickyColor,
  selectedConnectorType,
  drawToolType = "pen",
  penColor,
  penWidth,
  onUpdateObjects,
  onSelectObjects,
  onPanChange,
  onZoomChange,
  onSelectTool,
  onUndo,
  onRedo,
}: WhiteboardCanvasProps) {
  // Interaction State
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [initialObjectBounds, setInitialObjectBounds] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [marquee, setMarquee] = useState<SelectionBox | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Point[]>([]);
  const [newShapePreview, setNewShapePreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; anchor: AnchorPosition } | null>(null);
  const [connectingCurrentPoint, setConnectingCurrentPoint] = useState<Point | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredObjId, setHoveredObjId] = useState<string | null>(null);

  // Space key hold for quick pan
  const [spacePressed, setSpacePressed] = useState(false);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space" && !spacePressed) {
        setSpacePressed(true);
      }

      if (e.key === "v" || e.key === "V") onSelectTool("select");
      if (e.key === "h" || e.key === "H") onSelectTool("hand");
      if (e.key === "t" || e.key === "T") onSelectTool("text");
      if (e.key === "d" || e.key === "D") onSelectTool("draw");
      if (e.key === "a" || e.key === "A") onSelectTool("connector");
      if (e.key === "n" || e.key === "N") onSelectTool("sticky");

      // Delete
      if ((e.key === "Backspace" || e.key === "Delete") && selectedIds.length > 0) {
        onUpdateObjects(objects.filter((o) => !selectedIds.includes(o.id)));
        onSelectObjects([]);
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D") && selectedIds.length > 0) {
        e.preventDefault();
        const duplicates = objects
          .filter((o) => selectedIds.includes(o.id))
          .map((o) => ({
            ...o,
            id: createId("obj_dup"),
            x: o.x + 30,
            y: o.y + 30,
            zIndex: o.zIndex + 1,
          }));
        onUpdateObjects([...objects, ...duplicates]);
        onSelectObjects(duplicates.map((d) => d.id));
      }

      // Select All (Ctrl+A / Cmd+A)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        onSelectObjects(objects.map((o) => o.id));
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
      }

      // Redo (Ctrl+Y)
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        onRedo();
      }

      // Escape
      if (e.key === "Escape") {
        onSelectObjects([]);
        setEditingId(null);
        setDragMode("none");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [objects, onRedo, onSelectObjects, onSelectTool, onUndo, onUpdateObjects, selectedIds, spacePressed]);

  // Handle clipboard image paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const dataUrl = uploadEvent.target?.result as string;
            if (!dataUrl) return;

            // Place pasted image near the center of the current canvas view
            const center = screenToCanvas(
              { x: window.innerWidth / 2, y: window.innerHeight / 2 },
              pan,
              zoom
            );

            const newImg: CanvasObject = {
              id: createId("obj_img"),
              type: "image",
              x: center.x - 150,
              y: center.y - 100,
              width: 300,
              height: 200,
              src: dataUrl,
              zIndex: objects.length + 1,
            };

            onUpdateObjects([...objects, newImg]);
            onSelectObjects([newImg.id]);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [objects, onSelectObjects, onUpdateObjects, pan, zoom]);

  // Mouse Wheel Zoom / Pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newZoom = Math.min(3.0, Math.max(0.2, zoom * zoomFactor));

        // Zoom centered on cursor
        const rect = getCanvasRect(e);
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
          const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

          onZoomChange(newZoom);
          onPanChange({ x: newPanX, y: newPanY });
        }
      } else {
        // Pan
        onPanChange({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        });
      }
    },
    [onPanChange, onZoomChange, pan.x, pan.y, zoom]
  );

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(".contextual-toolbar") ||
      target.closest(".whiteboard-toolbar") ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea")
    ) {
      return;
    }

    const rect = getCanvasRect(e);
    if (!rect) return;

    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPt = screenToCanvas(screenPt, pan, zoom);

    // Pan mode (Space, Hand tool, or middle click)
    if (spacePressed || activeTool === "hand" || e.button === 1) {
      setDragMode("pan");
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left click interactions
    if (e.button === 0) {
      if (activeTool === "draw") {
        setDragMode("draw");
        setCurrentDrawPoints([canvasPt]);
        return;
      }

      if (activeTool === "shape") {
        setDragMode("create_shape");
        setDragStart(canvasPt);
        setNewShapePreview({ x: canvasPt.x, y: canvasPt.y, width: 0, height: 0 });
        return;
      }

      if (activeTool === "sticky") {
        const newSticky: CanvasObject = {
          id: createId("obj_sticky"),
          type: "sticky",
          x: canvasPt.x - 80,
          y: canvasPt.y - 80,
          width: 160,
          height: 160,
          color: selectedStickyColor || "#fef08a",
          text: "",
          fontSize: 16,
          zIndex: objects.length + 1,
        };
        onUpdateObjects([...objects, newSticky]);
        onSelectObjects([newSticky.id]);
        setEditingId(newSticky.id);
        onSelectTool("select");
        return;
      }

      if (activeTool === "text") {
        const newText: CanvasObject = {
          id: createId("obj_text"),
          type: "text",
          x: canvasPt.x,
          y: canvasPt.y,
          width: 160,
          height: 36,
          text: "",
          color: "#0f172a",
          fontSize: 16,
          zIndex: objects.length + 1,
        };
        onUpdateObjects([...objects, newText]);
        onSelectObjects([newText.id]);
        setEditingId(newText.id);
        onSelectTool("select");
        return;
      }

      if (activeTool === "connector") {
        const newConnector: CanvasObject = {
          id: createId("obj_conn"),
          type: "connector",
          x: canvasPt.x - 70,
          y: canvasPt.y - 20,
          width: 140,
          height: 40,
          connectorType: selectedConnectorType || "elbow",
          strokeStyle: "solid",
          stroke: "#0f172a",
          strokeWidth: 2,
          endArrow: "arrow",
          zIndex: objects.length + 1,
        };
        onUpdateObjects([...objects, newConnector]);
        onSelectObjects([newConnector.id]);
        onSelectTool("select");
        return;
      }

      // Marquee selection if clicked on empty canvas in select mode
      if (activeTool === "select") {
        setDragMode("marquee");
        setDragStart(canvasPt);
        setMarquee({ startX: canvasPt.x, startY: canvasPt.y, endX: canvasPt.x, endY: canvasPt.y });
        onSelectObjects([]);
        setEditingId(null);
      }
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = getCanvasRect(e);
    if (!rect) return;

    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPt = screenToCanvas(screenPt, pan, zoom);

    if (dragMode === "pan") {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (dragMode === "draw") {
      setCurrentDrawPoints((prev) => [...prev, canvasPt]);
      return;
    }

    if (dragMode === "create_shape" && newShapePreview) {
      const x = Math.min(dragStart.x, canvasPt.x);
      const y = Math.min(dragStart.y, canvasPt.y);
      const width = Math.max(10, Math.abs(canvasPt.x - dragStart.x));
      const height = Math.max(10, Math.abs(canvasPt.y - dragStart.y));
      setNewShapePreview({ x, y, width, height });
      return;
    }

    if (dragMode === "marquee" && marquee) {
      setMarquee({
        startX: dragStart.x,
        startY: dragStart.y,
        endX: canvasPt.x,
        endY: canvasPt.y,
      });

      // Find objects inside marquee box
      const minX = Math.min(dragStart.x, canvasPt.x);
      const maxX = Math.max(dragStart.x, canvasPt.x);
      const minY = Math.min(dragStart.y, canvasPt.y);
      const maxY = Math.max(dragStart.y, canvasPt.y);

      const inside = objects
        .filter((o) => {
          return o.x < maxX && o.x + o.width > minX && o.y < maxY && o.y + o.height > minY;
        })
        .map((o) => o.id);

      onSelectObjects(inside);
      return;
    }

    if (dragMode === "connect") {
      setConnectingCurrentPoint(canvasPt);
      return;
    }

    if (dragMode === "move" && selectedIds.length > 0) {
      const dx = canvasPt.x - dragStart.x;
      const dy = canvasPt.y - dragStart.y;

      const updated = objects.map((obj) => {
        if (selectedIds.includes(obj.id)) {
          const init = initialObjectBounds[obj.id];
          if (init) {
            return {
              ...obj,
              x: init.x + dx,
              y: init.y + dy,
            };
          }
        }
        return obj;
      });

      onUpdateObjects(updated);
      return;
    }

    if (dragMode === "resize" && selectedIds.length === 1) {
      const targetId = selectedIds[0];
      const init = initialObjectBounds[targetId];
      if (!init) return;

      const dx = canvasPt.x - dragStart.x;
      const dy = canvasPt.y - dragStart.y;

      let newX = init.x;
      let newY = init.y;
      let newWidth = init.width;
      let newHeight = init.height;

      if (resizeHandle.includes("e")) newWidth = Math.max(20, init.width + dx);
      if (resizeHandle.includes("s")) newHeight = Math.max(20, init.height + dy);
      if (resizeHandle.includes("w")) {
        const potentialW = init.width - dx;
        if (potentialW >= 20) {
          newWidth = potentialW;
          newX = init.x + dx;
        }
      }
      if (resizeHandle.includes("n")) {
        const potentialH = init.height - dy;
        if (potentialH >= 20) {
          newHeight = potentialH;
          newY = init.y + dy;
        }
      }

      onUpdateObjects(
        objects.map((obj) =>
          obj.id === targetId ? { ...obj, x: newX, y: newY, width: newWidth, height: newHeight } : obj
        )
      );
      return;
    }
  };

  // Mouse Up handler
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragMode === "draw" && currentDrawPoints.length > 1) {
      // Find bounding box for drawn stroke
      const xs = currentDrawPoints.map((p) => p.x);
      const ys = currentDrawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const opacity = drawToolType === "highlighter" ? 0.35 : drawToolType === "pencil" ? 0.8 : 1;
      const newDrawing: CanvasObject = {
        id: createId("obj_draw"),
        type: "drawing",
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        points: currentDrawPoints,
        color: penColor || "#1e293b",
        strokeWidth: penWidth || 3,
        opacity,
        toolType: drawToolType,
        zIndex: objects.length + 1,
      };

      onUpdateObjects([...objects, newDrawing]);
      setCurrentDrawPoints([]);
    }

    if (dragMode === "create_shape" && newShapePreview) {
      const width = Math.max(60, newShapePreview.width);
      const height = Math.max(40, newShapePreview.height);

      const newShape: CanvasObject = {
        id: createId("obj_shape"),
        type: "shape",
        shapeType: selectedShapeType || "rectangle",
        x: newShapePreview.x,
        y: newShapePreview.y,
        width,
        height,
        fill: "#ffffff",
        stroke: "#3b82f6",
        strokeWidth: 2,
        strokeStyle: "solid",
        zIndex: objects.length + 1,
      };

      onUpdateObjects([...objects, newShape]);
      onSelectObjects([newShape.id]);
      setNewShapePreview(null);
      onSelectTool("select");
    }

    if (dragMode === "connect" && connectingFrom) {
      // Check if dropped near another object's anchor
      const rect = getCanvasRect(e);
      if (rect) {
        const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const canvasPt = screenToCanvas(screenPt, pan, zoom);

        const targetObj = objects.find(
          (o) =>
            o.id !== connectingFrom.id &&
            canvasPt.x >= o.x - 20 &&
            canvasPt.x <= o.x + o.width + 20 &&
            canvasPt.y >= o.y - 20 &&
            canvasPt.y <= o.y + o.height + 20
        );

        if (targetObj) {
          // Snap to closest anchor on target object
          const { anchor: toAnchor } = getClosestAnchor(targetObj, canvasPt);

          const newConnector: CanvasObject = {
            id: createId("obj_conn"),
            type: "connector",
            x: Math.min(canvasPt.x, targetObj.x),
            y: Math.min(canvasPt.y, targetObj.y),
            width: Math.abs(canvasPt.x - targetObj.x),
            height: Math.abs(canvasPt.y - targetObj.y),
            fromId: connectingFrom.id,
            fromAnchor: connectingFrom.anchor,
            toId: targetObj.id,
            toAnchor,
            connectorType: selectedConnectorType || "elbow",
            strokeStyle: "solid",
            stroke: "#0f172a",
            strokeWidth: 2,
            endArrow: "arrow",
            zIndex: objects.length + 1,
          };

          onUpdateObjects([...objects, newConnector]);
          onSelectObjects([newConnector.id]);
          onSelectTool("select");
        }
      }

      setConnectingFrom(null);
      setConnectingCurrentPoint(null);
    }

    setDragMode("none");
    setMarquee(null);
    setInitialObjectBounds({});
  };

  // Object Click / Drag Start
  const handleObjectMouseDown = (e: React.MouseEvent, obj: CanvasObject) => {
    e.stopPropagation();

    // If using Hand tool or space pressed, let canvas handle panning
    if (activeTool === "hand" || spacePressed || e.button === 1) {
      handleMouseDown(e);
      return;
    }

    const rect = getCanvasRect(e);
    if (!rect) return;
    const canvasPt = screenToCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top }, pan, zoom);

    // Multi-select with Shift
    if (e.shiftKey) {
      if (selectedIds.includes(obj.id)) {
        onSelectObjects(selectedIds.filter((id) => id !== obj.id));
      } else {
        onSelectObjects([...selectedIds, obj.id]);
      }
    } else {
      if (!selectedIds.includes(obj.id)) {
        onSelectObjects([obj.id]);
      }
    }

    // Set initial bounds for smooth dragging
    const bounds: Record<string, { x: number; y: number; width: number; height: number }> = {};
    const idsToMove = selectedIds.includes(obj.id) ? selectedIds : [obj.id];
    idsToMove.forEach((id) => {
      const found = objects.find((o) => o.id === id);
      if (found) {
        bounds[id] = { x: found.x, y: found.y, width: found.width, height: found.height };
      }
    });

    setInitialObjectBounds(bounds);
    setDragStart(canvasPt);
    setDragMode("move");
  };

  // Resize handle mouse down
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string, obj: CanvasObject) => {
    e.stopPropagation();
    const rect = getCanvasRect(e);
    if (!rect) return;
    const canvasPt = screenToCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top }, pan, zoom);

    setDragMode("resize");
    setResizeHandle(handle);
    setDragStart(canvasPt);
    setInitialObjectBounds({
      [obj.id]: { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
    });
  };

  // Start connector drag from an object anchor point
  const handleAnchorMouseDown = (e: React.MouseEvent, obj: CanvasObject, anchor: AnchorPosition) => {
    e.stopPropagation();
    setDragMode("connect");
    setConnectingFrom({ id: obj.id, anchor });
  };

  // Drop image file from desktop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];
    if (file.type.indexOf("image") !== -1) {
      const dropClientX = e.clientX;
      const dropClientY = e.clientY;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (!dataUrl) return;

        const rect = getCanvasRect();
        if (!rect) return;

        const canvasPt = screenToCanvas(
          { x: dropClientX - rect.left, y: dropClientY - rect.top },
          pan,
          zoom
        );

        const newImg: CanvasObject = {
          id: createId("obj_img"),
          type: "image",
          x: canvasPt.x - 150,
          y: canvasPt.y - 100,
          width: 300,
          height: 200,
          src: dataUrl,
          caption: file.name,
          zIndex: objects.length + 1,
        };

        onUpdateObjects([...objects, newImg]);
        onSelectObjects([newImg.id]);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedObject = objects.find((o) => selectedIds.includes(o.id));
  const connectingFromObj = connectingFrom ? objects.find((o) => o.id === connectingFrom.id) : null;
  const connectingStartPt =
    connectingFromObj && connectingFrom
      ? getAnchorPoint(connectingFromObj, connectingFrom.anchor)
      : connectingCurrentPoint;

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`canvas-container relative w-full h-full overflow-hidden select-none bg-white ${
        spacePressed || activeTool === "hand" ? "cursor-grab" : "cursor-default"
      }`}
      style={{
        backgroundImage: `radial-gradient(#94a3b8 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* SVG Canvas Layer (Connectors, Freehand Drawings, Anchors) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Render Connectors */}
        {objects
          .filter((o): o is CanvasObject & { type: "connector" } => o.type === "connector")
          .map((connector) => (
            <ConnectorRenderer
              key={connector.id}
              connector={connector}
              objects={objects}
              isSelected={selectedIds.includes(connector.id)}
              onSelect={() => onSelectObjects([connector.id])}
            />
          ))}

        {/* Render Freehand Drawings in SVG Layer */}
        {objects
          .filter((o): o is CanvasObject & { type: "drawing" } => o.type === "drawing")
          .map((drawing) => {
            const isSelected = selectedIds.includes(drawing.id);
            const pathStr =
              drawing.points && drawing.points.length > 0
                ? `M ${drawing.points[0].x} ${drawing.points[0].y} ` +
                  drawing.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
                : "";
            return (
              <g
                key={drawing.id}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObjects([drawing.id]);
                }}
              >
                {/* Wide invisible click hitbox */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={(drawing.strokeWidth || 3) + 14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pathStr}
                  fill="none"
                  stroke={isSelected ? "#7c3aed" : drawing.color || "#1e293b"}
                  strokeWidth={drawing.strokeWidth || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={drawing.opacity ?? (drawing.toolType === "highlighter" ? 0.35 : 1)}
                />
              </g>
            );
          })}

        {/* Live Drawing Stroke Preview in SVG Layer */}
        {dragMode === "draw" && currentDrawPoints.length > 1 && (
          <path
            d={
              `M ${currentDrawPoints[0].x} ${currentDrawPoints[0].y} ` +
              currentDrawPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
            }
            fill="none"
            stroke={penColor || "#1e293b"}
            strokeWidth={penWidth || 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={drawToolType === "highlighter" ? 0.35 : drawToolType === "pencil" ? 0.8 : 1}
          />
        )}

        {/* Live connector draft during creation */}
        {dragMode === "connect" && connectingStartPt && connectingCurrentPoint && (
          <line
            x1={connectingStartPt.x}
            y1={connectingStartPt.y}
            x2={connectingCurrentPoint.x}
            y2={connectingCurrentPoint.y}
            stroke="#7c3aed"
            strokeWidth={2.5}
            strokeDasharray="5 5"
          />
        )}
      </svg>

      {/* HTML Objects Layer (Shapes, Sticky Notes, Task Cards, Frames, Images, Text) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {objects.map((obj) => {
          if (obj.type === "connector" || obj.type === "drawing") return null;

          const isSelected = selectedIds.includes(obj.id);
          const isSingleSelected = isSelected && selectedIds.length === 1;

          return (
            <div
              key={obj.id}
              onMouseDown={(e) => handleObjectMouseDown(e, obj)}
              onDoubleClick={() => setEditingId(obj.id)}
              onMouseEnter={() => setHoveredObjId(obj.id)}
              onMouseLeave={() => setHoveredObjId(null)}
              className={`absolute pointer-events-auto transition-shadow ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-white"
                  : "hover:ring-1 hover:ring-slate-300"
              }`}
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                zIndex: obj.zIndex,
                cursor: activeTool === "hand" || spacePressed ? "grab" : "move",
              }}
            >
              {/* Render object content based on type */}
              {obj.type === "shape" && (
                <ShapeRenderer
                  object={obj}
                  isEditing={editingId === obj.id}
                  onTextChange={(newText) => {
                    onUpdateObjects(
                      objects.map((o) => (o.id === obj.id ? { ...o, text: newText } : o))
                    );
                  }}
                />
              )}

              {obj.type === "sticky" && (
                <StickyNoteRenderer
                  object={obj}
                  isEditing={editingId === obj.id}
                  onTextChange={(newText) => {
                    onUpdateObjects(
                      objects.map((o) => (o.id === obj.id ? { ...o, text: newText } : o))
                    );
                  }}
                />
              )}

              {obj.type === "text" && (
                <TextRenderer
                  object={obj}
                  isEditing={editingId === obj.id}
                  onTextChange={(newText) => {
                    onUpdateObjects(
                      objects.map((o) => (o.id === obj.id ? { ...o, text: newText } : o))
                    );
                  }}
                />
              )}

              {obj.type === "task" && <TaskCardRenderer object={obj} />}

              {obj.type === "image" && <ImageRenderer object={obj} />}

              {obj.type === "frame" && (
                <FrameRenderer
                  object={obj}
                  isEditing={editingId === obj.id}
                  onTitleChange={(newTitle) => {
                    onUpdateObjects(
                      objects.map((o) => (o.id === obj.id ? { ...o, title: newTitle } : o))
                    );
                  }}
                />
              )}

              {/* Selection Resize Handles & Connection Anchors */}
              {isSingleSelected && (
                <div className="absolute inset-0 border-2 border-primary border-dashed pointer-events-none rounded-xs" />
              )}

              {/* 8 Resize Handles */}
              {isSingleSelected &&
                ["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => {
                  let positionStyle = "";
                  if (handle === "nw") positionStyle = "-top-1.5 -left-1.5 cursor-nwse-resize";
                  if (handle === "n") positionStyle = "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize";
                  if (handle === "ne") positionStyle = "-top-1.5 -right-1.5 cursor-nesw-resize";
                  if (handle === "e") positionStyle = "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize";
                  if (handle === "se") positionStyle = "-bottom-1.5 -right-1.5 cursor-nwse-resize";
                  if (handle === "s") positionStyle = "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize";
                  if (handle === "sw") positionStyle = "-bottom-1.5 -left-1.5 cursor-nesw-resize";
                  if (handle === "w") positionStyle = "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize";

                  return (
                    <div
                      key={handle}
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, handle, obj)}
                      className={`absolute w-3 h-3 bg-white border-2 border-primary rounded-xs shadow-xs pointer-events-auto ${positionStyle}`}
                    />
                  );
                })}

              {/* 4 Connection Anchors (visible when hovered or selected, drag from here to connect) */}
              {(isSingleSelected || hoveredObjId === obj.id || dragMode === "connect") &&
                (["top", "right", "bottom", "left"] as AnchorPosition[]).map((anchor) => {
                  let anchorPos = "";
                  if (anchor === "top") anchorPos = "-top-3.5 left-1/2 -translate-x-1/2";
                  if (anchor === "right") anchorPos = "top-1/2 -translate-y-1/2 -right-3.5";
                  if (anchor === "bottom") anchorPos = "-bottom-3.5 left-1/2 -translate-x-1/2";
                  if (anchor === "left") anchorPos = "top-1/2 -translate-y-1/2 -left-3.5";

                  return (
                    <div
                      key={anchor}
                      onMouseDown={(e) => handleAnchorMouseDown(e, obj, anchor)}
                      title="Drag to connect arrow"
                      className={`absolute w-3.5 h-3.5 rounded-full bg-violet-600 border-2 border-white shadow-md cursor-crosshair hover:scale-150 transition-transform pointer-events-auto ${anchorPos}`}
                    />
                  );
                })}
            </div>
          );
        })}

        {/* Live Shape Creation Preview */}
        {dragMode === "create_shape" && newShapePreview && (
          <div
            className="absolute border-2 border-primary border-dashed bg-primary/10 rounded-xs pointer-events-none"
            style={{
              left: `${newShapePreview.x}px`,
              top: `${newShapePreview.y}px`,
              width: `${newShapePreview.width}px`,
              height: `${newShapePreview.height}px`,
            }}
          />
        )}

        {/* Marquee Drag Selection Box */}
        {dragMode === "marquee" && marquee && (
          <div
            className="absolute border border-primary bg-primary/10 pointer-events-none"
            style={{
              left: `${Math.min(marquee.startX, marquee.endX)}px`,
              top: `${Math.min(marquee.startY, marquee.endY)}px`,
              width: `${Math.abs(marquee.endX - marquee.startX)}px`,
              height: `${Math.abs(marquee.endY - marquee.startY)}px`,
            }}
          />
        )}
      </div>

      {/* Floating Contextual Toolbar above selected object */}
      {selectedObject && selectedIds.length === 1 && (
        <ContextualToolbar
          selectedObject={selectedObject}
          zoom={zoom}
          pan={pan}
          onUpdateObject={(id, updates) => {
            onUpdateObjects(
              objects.map((o) => (o.id === id ? ({ ...o, ...updates } as CanvasObject) : o))
            );
          }}
          onDuplicate={(id) => {
            const found = objects.find((o) => o.id === id);
            if (!found) return;
            const duplicate: CanvasObject = {
              ...found,
              id: createId("obj_dup"),
              x: found.x + 30,
              y: found.y + 30,
              zIndex: objects.length + 1,
            };
            onUpdateObjects([...objects, duplicate]);
            onSelectObjects([duplicate.id]);
          }}
          onDelete={(id) => {
            onUpdateObjects(objects.filter((o) => o.id !== id && (o.type !== "connector" || (o.fromId !== id && o.toId !== id))));
            onSelectObjects([]);
          }}
          onBringToFront={(id) => {
            const maxZ = Math.max(...objects.map((o) => o.zIndex), 0);
            onUpdateObjects(
              objects.map((o) => (o.id === id ? { ...o, zIndex: maxZ + 1 } : o))
            );
          }}
          onSendToBack={(id) => {
            const minZ = Math.min(...objects.map((o) => o.zIndex), 0);
            onUpdateObjects(
              objects.map((o) => (o.id === id ? { ...o, zIndex: Math.max(1, minZ - 1) } : o))
            );
          }}
        />
      )}
    </div>
  );
}
