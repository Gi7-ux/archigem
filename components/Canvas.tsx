/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {Upload} from 'lucide-react';
import {useEffect} from 'react';
import {TOOLS} from '../constants';
import {drawOverlays} from '../lib/utils';
import {Overlay, Point, Tool} from '../types';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  baseImage: string | null;
  baseImageElement: HTMLImageElement | null;
  activeTool: Tool;
  overlays: Overlay[];
  panOffset: Point;
  zoom: number;
  currentDrawing: Overlay | null;
  snapIndicator: Point | null;
  canvasHandlers: {
    handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    handleMouseUp: () => void;
    handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  };
}

export function Canvas({
  canvasRef,
  baseImage,
  baseImageElement,
  activeTool,
  overlays,
  panOffset,
  zoom,
  currentDrawing,
  snapIndicator,
  canvasHandlers,
}: CanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    if (baseImageElement) {
      ctx.drawImage(baseImageElement, 0, 0);
    }

    // Draw committed overlays and current drawing for live preview
    drawOverlays(ctx, overlays, zoom);
    if (currentDrawing) {
      drawOverlays(ctx, [currentDrawing], zoom);
    }

    // Draw snap indicator
    if (snapIndicator) {
      ctx.beginPath();
      ctx.arc(snapIndicator.x, snapIndicator.y, 5 / zoom, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
    }

    ctx.restore();
  }, [
    baseImageElement,
    overlays,
    zoom,
    panOffset,
    currentDrawing,
    snapIndicator,
    canvasRef,
  ]);

  if (!baseImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8">
        <Upload className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Upload a Building Plan</h2>
        <p className="text-center">
          Click the "Upload Plan" button to get started.
        </p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      onMouseDown={canvasHandlers.handleMouseDown}
      onMouseMove={canvasHandlers.handleMouseMove}
      onMouseUp={canvasHandlers.handleMouseUp}
      onMouseLeave={canvasHandlers.handleMouseUp}
      onWheel={canvasHandlers.handleWheel}
      className={`w-full h-full ${
        activeTool === TOOLS.PAN ? 'cursor-grab' : 'cursor-crosshair'
      } touch-none`}
    />
  );
}
