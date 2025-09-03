/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {TOOLS} from './constants';

/**
 * Represents a tool name.
 */
export type Tool = (typeof TOOLS)[keyof typeof TOOLS];

/**
 * Represents a point with x and y coordinates.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a line overlay on the canvas.
 */
export interface LineOverlay {
  type: typeof TOOLS.LINE;
  start: Point;
  end: Point;
}

/**
 * Represents a rectangle overlay on the canvas.
 */
export interface RectOverlay {
  type: typeof TOOLS.RECT;
  start: Point;
  end: Point;
}

/**
 * Represents a dot overlay on the canvas.
 */
export interface DotOverlay {
  type: typeof TOOLS.DOT;
  pos: Point;
}

/**
 * Represents any type of overlay on the canvas.
 */
export type Overlay = LineOverlay | RectOverlay | DotOverlay;
