"use client";

import { useCallback, useState } from "react";
import { CanvasObject } from "./types";

export function useWhiteboardHistory(initialPresent: CanvasObject[]) {
  const [past, setPast] = useState<CanvasObject[][]>([]);
  const [present, setPresent] = useState<CanvasObject[]>(initialPresent);
  const [future, setFuture] = useState<CanvasObject[][]>([]);

  const pushState = useCallback((newPresent: CanvasObject[]) => {
    setPast((prevPast) => [...prevPast.slice(-30), present]);
    setPresent(newPresent);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  return {
    state: present,
    setState: setPresent,
    pushState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
