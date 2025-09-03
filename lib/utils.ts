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

export const drawOverlays = (
  ctx,
  overlaysToDraw,
  scale,
  offsetX = 0,
  offsetY = 0,
  forMask = false,
) => {
  if (forMask) {
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    // For masks, we want thicker lines to ensure the area is fully covered
    ctx.lineWidth = 20 * Math.max(1, scale / 5);
  } else {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 5 * Math.max(1, scale / 5);
  }

  overlaysToDraw.forEach((overlay) => {
    if (!overlay) return;
    ctx.beginPath();

    const transformX = (x) => x * scale + offsetX;
    const transformY = (y) => y * scale + offsetY;

    switch (overlay.type) {
      case TOOLS.LINE:
        ctx.moveTo(transformX(overlay.start.x), transformY(overlay.start.y));
        ctx.lineTo(transformX(overlay.end.x), transformY(overlay.end.y));
        // For masks, we stroke with a thick line to create a filled area
        ctx.stroke();
        break;
      case TOOLS.RECT:
        {
          const startX = transformX(overlay.start.x);
          const startY = transformY(overlay.start.y);
          const endX = transformX(overlay.end.x);
          const endY = transformY(overlay.end.y);
          const rect = [
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.abs(endX - startX),
            Math.abs(endY - startY),
          ];
          if (forMask) {
            ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
          } else {
            ctx.strokeRect(rect[0], rect[1], rect[2], rect[3]);
          }
        }
        break;
      case TOOLS.DOT:
        ctx.arc(
          transformX(overlay.pos.x),
          transformY(overlay.pos.y),
          // Use a larger radius for the mask
          (forMask ? 20 : 10) * Math.max(1, scale / 5),
          0,
          2 * Math.PI,
        );
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

import jsPDF from 'jspdf';
import { Overlay } from '../types';

export const exportToPdf = (
  baseImageElement: HTMLImageElement,
  overlays: Overlay[],
) => {
  const { naturalWidth: imgWidth, naturalHeight: imgHeight } = baseImageElement;
  const isLandscape = imgWidth > imgHeight;
  const orientation = isLandscape ? 'l' : 'p';

  const canvas = document.createElement('canvas');
  canvas.width = imgWidth;
  canvas.height = imgHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImageElement, 0, 0);

  const imgData = canvas.toDataURL('image/png');

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a0',
  });

  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();

  const imgAspectRatio = imgWidth / imgHeight;
  const pdfAspectRatio = pdfWidth / pdfHeight;

  let renderWidth, renderHeight;

  if (imgAspectRatio > pdfAspectRatio) {
    renderWidth = pdfWidth;
    renderHeight = renderWidth / imgAspectRatio;
  } else {
    renderHeight = pdfHeight;
    renderWidth = renderHeight * imgAspectRatio;
  }

  const x = (pdfWidth - renderWidth) / 2;
  const y = (pdfHeight - renderHeight) / 2;

  doc.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);

  const scale = renderWidth / imgWidth;
  const pdfLineWidth = 0.5;
  doc.setLineWidth(pdfLineWidth);
  doc.setDrawColor(255, 0, 0);
  doc.setFillColor(255, 0, 0);

  overlays.forEach((overlay) => {
    if (!overlay) return;

    const transformX = (coord) => coord * scale + x;
    const transformY = (coord) => coord * scale + y;

    switch (overlay.type) {
      case 'line':
        doc.line(
          transformX(overlay.start.x),
          transformY(overlay.start.y),
          transformX(overlay.end.x),
          transformY(overlay.end.y),
        );
        break;
      case 'rect':
        const startX = transformX(
          Math.min(overlay.start.x, overlay.end.x),
        );
        const startY = transformY(
          Math.min(overlay.start.y, overlay.end.y),
        );
        const rectWidth = Math.abs(overlay.end.x - overlay.start.x) * scale;
        const rectHeight =
          Math.abs(overlay.end.y - overlay.start.y) * scale;
        doc.rect(startX, startY, rectWidth, rectHeight, 'S');
        break;
      case 'dot':
        const radius = 1;
        doc.circle(
          transformX(overlay.pos.x),
          transformY(overlay.pos.y),
          radius,
          'F',
        );
        break;
    }
  });

  doc.save('building-plan.pdf');
};