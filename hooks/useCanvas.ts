/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {RefObject, useCallback, useRef, useState} from 'react';
import {TOOLS} from '../constants';
import {findSnapPoint} from '../lib/utils';
import {Overlay, Point, Tool} from '../types';

/**
 * Custom hook for managing canvas interactions, including drawing, panning, zooming, and history.
 * @param canvasRef A React ref to the canvas element.
 * @returns An object containing canvas state and handlers.
 */
export const useCanvas = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const isInteractingRef = useRef(false);
  const startPointRef = useRef<Point>({x: 0, y: 0});

  const [activeTool, setActiveTool] = useState<Tool>(TOOLS.PAN);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [history, setHistory] = useState<Overlay[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({x: 0, y: 0});
  const [currentDrawing, setCurrentDrawing] = useState<Overlay | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<Point | null>(null);

  /**
   * Records a new state of overlays in the history.
   * @param newOverlays The new array of overlays to record.
   */
  const recordHistory = (newOverlays: Overlay[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newOverlays);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * Gets the canvas coordinates from a mouse or touch event.
   * @param e The mouse or touch event.
   * @returns The coordinates on the canvas.
   */
  const getCanvasCoordinates = (
    e: MouseEvent | TouchEvent,
  ): {x: number; y: number} => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  /**
   * Converts screen coordinates to world coordinates (accounting for pan and zoom).
   * @param screenCoords The screen coordinates.
   * @returns The world coordinates.
   */
  const screenToWorld = (screenCoords: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return screenCoords;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (screenCoords.x * scaleX - panOffset.x) / zoom,
      y: (screenCoords.y * scaleY - panOffset.y) / zoom,
    };
  };

  /**
   * Handles the mouse down event on the canvas.
   * @param e The React mouse event.
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isInteractingRef.current = true;
    const screenCoords = getCanvasCoordinates(e.nativeEvent);
    let worldCoords = screenToWorld(screenCoords);

    // Snap the start point for drawing tools
    if (
      activeTool === TOOLS.LINE ||
      activeTool === TOOLS.RECT ||
      activeTool === TOOLS.DOT
    ) {
      const snapResult = findSnapPoint(worldCoords, overlays, zoom);
      worldCoords = snapResult.point;
    }

    startPointRef.current =
      activeTool === TOOLS.PAN ? screenCoords : worldCoords;

    if (activeTool === TOOLS.DOT) {
      const newOverlays = [...overlays, {type: TOOLS.DOT, pos: worldCoords}];
      setOverlays(newOverlays);
      recordHistory(newOverlays);
    }
  };

  /**
   * Handles the mouse move event on the canvas.
   * @param e The React mouse event.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteractingRef.current) return;
    const screenCoords = getCanvasCoordinates(e.nativeEvent);

    if (activeTool === TOOLS.PAN) {
      const dx = screenCoords.x - startPointRef.current.x;
      const dy = screenCoords.y - startPointRef.current.y;
      setPanOffset({x: panOffset.x + dx, y: panOffset.y + dy});
      startPointRef.current = screenCoords;
    } else {
      let worldCoords = screenToWorld(screenCoords);
      const start = startPointRef.current;

      // Snap the end point while drawing
      const snapResult = findSnapPoint(worldCoords, overlays, zoom, start);
      worldCoords = snapResult.point;
      setSnapIndicator(snapResult.indicator);

      let shape: Overlay | null = null;
      if (activeTool === TOOLS.LINE) {
        shape = {type: TOOLS.LINE, start, end: worldCoords};
      } else if (activeTool === TOOLS.RECT) {
        shape = {type: TOOLS.RECT, start, end: worldCoords};
      }
      setCurrentDrawing(shape);
    }
  };

  /**
   * Handles the mouse up event on the canvas.
   */
  const handleMouseUp = () => {
    if (isInteractingRef.current && currentDrawing) {
      const newOverlays = [...overlays, currentDrawing];
      setOverlays(newOverlays);
      recordHistory(newOverlays);
    }
    isInteractingRef.current = false;
    setCurrentDrawing(null);
    setSnapIndicator(null); // Clear indicator on mouse up
  };

  /**
   * Handles zooming the canvas.
   * @param delta The change in zoom level.
   */
  const handleZoom = useCallback((delta: number) => {
    setZoom((prevZoom) => Math.max(0.1, Math.min(prevZoom + delta, 10)));
  }, []);

  /**
   * Handles the wheel event for zooming.
   * @param e The React wheel event.
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      handleZoom(e.deltaY * -0.01);
    },
    [handleZoom],
  );

  /**
   * Undoes the last action.
   */
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex]);
    }
  };

  /**
   * Redoes the last undone action.
   */
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex]);
    }
  };

  /**
   * Zooms in the canvas.
   */
  const zoomIn = () => handleZoom(0.2);

  /**
   * Zooms out the canvas.
   */
  const zoomOut = () => handleZoom(-0.2);

  /**
   * Clears all overlays from the canvas.
   * @param isNewImage If true, also resets the history.
   */
  const clearOverlays = (isNewImage: boolean) => {
    setOverlays([]);
    if (isNewImage) {
      setHistory([[]]);
      setHistoryIndex(0);
    } else {
      recordHistory([]);
    }
  };

  /**
   * Resets the entire canvas state (overlays, history, zoom, pan).
   */
  const resetCanvasState = () => {
    setOverlays([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setZoom(1);
    setPanOffset({x: 0, y: 0});
  };

  return {
    activeTool,
    setActiveTool,
    overlays,
    setOverlays,
    history,
    historyIndex,
    panOffset,
    zoom,
    currentDrawing,
    snapIndicator,
    canvasHandlers: {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
    },
    undo,
    redo,
    zoomIn,
    zoomOut,
    clearOverlays,
    resetCanvasState,
  };
};
