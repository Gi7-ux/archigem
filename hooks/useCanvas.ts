/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useCallback, useRef, useState} from 'react';
import {TOOLS} from '../constants';
import {findSnapPoint} from '../lib/utils';
import {Point, Tool} from '../types';

export const useCanvas = (canvasRef) => {
  const isInteractingRef = useRef(false);
  const startPointRef = useRef({x: 0, y: 0});

  const [activeTool, setActiveTool] = useState<Tool>(TOOLS.PAN);
  const [overlays, setOverlays] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({x: 0, y: 0});
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [snapIndicator, setSnapIndicator] = useState<Point | null>(null);

  const recordHistory = (newOverlays) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newOverlays);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const screenToWorld = (screenCoords) => {
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

  const handleMouseDown = (e) => {
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

  const handleMouseMove = (e) => {
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

      let shape = null;
      if (activeTool === TOOLS.LINE) {
        shape = {type: TOOLS.LINE, start, end: worldCoords};
      } else if (activeTool === TOOLS.RECT) {
        shape = {type: TOOLS.RECT, start, end: worldCoords};
      }
      setCurrentDrawing(shape);
    }
  };

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

  const handleZoom = useCallback((delta) => {
    setZoom((prevZoom) => Math.max(0.1, Math.min(prevZoom + delta, 10)));
  }, []);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      handleZoom(e.deltaY * -0.01);
    },
    [handleZoom],
  );

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex]);
    }
  };

  const zoomIn = () => handleZoom(0.2);
  const zoomOut = () => handleZoom(-0.2);

  const clearOverlays = (isNewImage) => {
    setOverlays([]);
    if (isNewImage) {
      setHistory([[]]);
      setHistoryIndex(0);
    } else {
      recordHistory([]);
    }
  };

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
