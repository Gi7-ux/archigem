/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {SNAP_THRESHOLD, TOOLS} from '../constants';
import {Overlay, Point} from '../types';

export function parseError(error) {
  if (typeof error !== 'string') return 'An unexpected error occurred.';
  const regex = /{"error":(.*)}/gm;
  const m = regex.exec(error);
  try {
    if (!m) return error;
    const e = m[1];
    const err = JSON.parse(e);
    return err.message || error;
  } catch (e) {
    return error;
  }
}

export const drawOverlays = (ctx, overlaysToDraw, zoom) => {
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.lineWidth = 5 / zoom; // Keep line width consistent when zooming

  overlaysToDraw.forEach((overlay) => {
    if (!overlay) return;
    ctx.beginPath();
    switch (overlay.type) {
      case TOOLS.LINE:
        ctx.moveTo(overlay.start.x, overlay.start.y);
        ctx.lineTo(overlay.end.x, overlay.end.y);
        ctx.stroke();
        break;
      case TOOLS.RECT:
        ctx.strokeRect(
          Math.min(overlay.start.x, overlay.end.x),
          Math.min(overlay.start.y, overlay.end.y),
          Math.abs(overlay.end.x - overlay.start.x),
          Math.abs(overlay.end.y - overlay.start.y),
        );
        break;
      case TOOLS.DOT:
        ctx.arc(overlay.pos.x, overlay.pos.y, 10 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        break;
    }
  });
};

// --- Snapping Logic ---

function getSnapGuides(overlays: Overlay[]) {
  const points: Point[] = [];
  const lines: {start: Point; end: Point}[] = [];

  overlays.forEach((overlay) => {
    switch (overlay.type) {
      case TOOLS.LINE:
        points.push(overlay.start, overlay.end);
        lines.push({start: overlay.start, end: overlay.end});
        break;
      case TOOLS.RECT:
        const {start, end} = overlay;
        const p1 = start;
        const p2 = {x: end.x, y: start.y};
        const p3 = end;
        const p4 = {x: start.x, y: end.y};
        points.push(p1, p2, p3, p4);
        lines.push({start: p1, end: p2});
        lines.push({start: p2, end: p3});
        lines.push({start: p3, end: p4});
        lines.push({start: p4, end: p1});
        break;
      case TOOLS.DOT:
        points.push(overlay.pos);
        break;
    }
  });

  return {points, lines};
}

function distance(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function closestPointOnLineSegment(p: Point, a: Point, b: Point) {
  const ap = {x: p.x - a.x, y: p.y - a.y};
  const ab = {x: b.x - a.x, y: b.y - a.y};
  const ab2 = ab.x * ab.x + ab.y * ab.y;
  if (ab2 === 0) return a;
  const ap_ab = ap.x * ab.x + ap.y * ab.y;
  let t = ap_ab / ab2;
  t = Math.max(0, Math.min(1, t));
  return {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
  };
}

export function findSnapPoint(
  currentPoint: Point,
  overlays: Overlay[],
  zoom: number,
  excludePoint: Point | null = null,
) {
  const worldThreshold = SNAP_THRESHOLD / zoom;
  const snapGuides = getSnapGuides(overlays);

  let bestSnap = {
    point: currentPoint,
    distance: Infinity,
    indicator: null as Point | null,
  };

  // Snap to points (corners/endpoints)
  for (const p of snapGuides.points) {
    if (excludePoint && p.x === excludePoint.x && p.y === excludePoint.y)
      continue;
    const d = distance(currentPoint, p);
    if (d < worldThreshold && d < bestSnap.distance) {
      bestSnap = {point: p, distance: d, indicator: p};
    }
  }

  // Snap to lines (edges)
  for (const line of snapGuides.lines) {
    const closestPoint = closestPointOnLineSegment(
      currentPoint,
      line.start,
      line.end,
    );
    const d = distance(currentPoint, closestPoint);
    if (d < worldThreshold && d < bestSnap.distance) {
      bestSnap = {point: closestPoint, distance: d, indicator: closestPoint};
    }
  }

  // Also consider axis alignment with the start point of the current drawing
  if (excludePoint) {
    // Horizontal alignment
    const dHoriz = Math.abs(currentPoint.y - excludePoint.y);
    if (dHoriz < worldThreshold && dHoriz < bestSnap.distance) {
      bestSnap = {
        point: {x: currentPoint.x, y: excludePoint.y},
        distance: dHoriz,
        indicator: null, // No indicator for axis alignment line
      };
    }
    // Vertical alignment
    const dVert = Math.abs(currentPoint.x - excludePoint.x);
    if (dVert < worldThreshold && dVert < bestSnap.distance) {
      bestSnap = {
        point: {x: excludePoint.x, y: currentPoint.y},
        distance: dVert,
        indicator: null,
      };
    }
  }

  return bestSnap;
}