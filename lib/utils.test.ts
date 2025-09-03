/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { exportToPdf } from './utils';
import { vi } from 'vitest';
import jsPDF from 'jspdf';
import { Overlay } from '../types';

// Mock the jsPDF library
const mockAddImage = vi.fn();
const mockSave = vi.fn();
const mockLine = vi.fn();
const mockRect = vi.fn();
const mockCircle = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetFillColor = vi.fn();

vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      addImage: mockAddImage,
      save: mockSave,
      line: mockLine,
      rect: mockRect,
      circle: mockCircle,
      setLineWidth: mockSetLineWidth,
      setDrawColor: mockSetDrawColor,
      setFillColor: mockSetFillColor,
      internal: {
        pageSize: {
          getWidth: () => 200, // Mock width in mm
          getHeight: () => 300, // Mock height in mm
        },
      },
    })),
  };
});

describe('exportToPdf', () => {
  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();
  });

  it('should scale overlays correctly for a portrait image', () => {
    const baseImageElement = {
      naturalWidth: 1000,
      naturalHeight: 2000,
      // Add other properties if needed by drawImage
    } as HTMLImageElement;

    const overlays: Overlay[] = [
      { type: 'line', start: { x: 10, y: 20 }, end: { x: 30, y: 40 } },
      { type: 'rect', start: { x: 50, y: 60 }, end: { x: 70, y: 80 } },
      { type: 'dot', pos: { x: 90, y: 100 } },
    ];

    // Mock canvas creation and context
    const mockGetContext = vi.fn(() => ({
        fillRect: vi.fn(),
        drawImage: vi.fn(),
    }));
    const mockToDataURL = vi.fn(() => 'mock-image-data');
    global.document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') {
            return {
                getContext: mockGetContext,
                toDataURL: mockToDataURL,
            } as any;
        }
        return {} as HTMLElement;
    });

    exportToPdf(baseImageElement, overlays);

    // 1. Check if jsPDF was called
    expect(jsPDF).toHaveBeenCalled();

    // 2. Check scaling calculations
    const imgWidth = 1000;
    const imgHeight = 2000;
    const pdfWidth = 200;
    const pdfHeight = 300;
    const imgAspectRatio = imgWidth / imgHeight; // 0.5
    const pdfAspectRatio = pdfWidth / pdfHeight; // 0.66

    let renderWidth, renderHeight;
    // Image is taller than or same aspect as the PDF page, so fit to height
    renderHeight = pdfHeight; // 300
    renderWidth = renderHeight * imgAspectRatio; // 300 * 0.5 = 150

    const scale = renderWidth / imgWidth; // 150 / 1000 = 0.15
    const x_offset = (pdfWidth - renderWidth) / 2; // (200 - 150) / 2 = 25
    const y_offset = (pdfHeight - renderHeight) / 2; // (300 - 300) / 2 = 0

    // 3. Check that addImage was called with correct parameters
    expect(mockAddImage).toHaveBeenCalledWith('mock-image-data', 'PNG', x_offset, y_offset, renderWidth, renderHeight);

    // 4. Check that overlay drawing functions were called with scaled coordinates
    const lineOverlay = overlays[0];
    expect(mockLine).toHaveBeenCalledWith(
        lineOverlay.start.x * scale + x_offset,
        lineOverlay.start.y * scale + y_offset,
        lineOverlay.end.x * scale + x_offset,
        lineOverlay.end.y * scale + y_offset
    );

    const rectOverlay = overlays[1];
    const rectX = Math.min(rectOverlay.start.x, rectOverlay.end.x) * scale + x_offset;
    const rectY = Math.min(rectOverlay.start.y, rectOverlay.end.y) * scale + y_offset;
    const rectW = Math.abs(rectOverlay.end.x - rectOverlay.start.x) * scale;
    const rectH = Math.abs(rectOverlay.end.y - rectOverlay.start.y) * scale;
    expect(mockRect).toHaveBeenCalledWith(rectX, rectY, rectW, rectH, 'S');

    const dotOverlay = overlays[2];
    expect(mockCircle).toHaveBeenCalledWith(
        dotOverlay.pos.x * scale + x_offset,
        dotOverlay.pos.y * scale + y_offset,
        1, // radius
        'F'
    );

    // 5. Check that save was called
    expect(mockSave).toHaveBeenCalledWith('building-plan.pdf');
  });
});
