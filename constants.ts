/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An object containing the available tool names.
 */
export const TOOLS = {
  PAN: 'pan',
  LINE: 'line',
  RECT: 'rect',
  DOT: 'dot',
} as const;

/**
 * The threshold in pixels for snapping to points or lines.
 */
export const SNAP_THRESHOLD = 10; // in pixels

/**
 * The width of an A0 size paper in pixels at 300 DPI.
 */
export const A0_WIDTH_PX = 9933;

/**
 * The height of an A0 size paper in pixels at 300 DPI.
 */
export const A0_HEIGHT_PX = 14043;
