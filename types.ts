/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {TOOLS} from './constants';

export type Tool = (typeof TOOLS)[keyof typeof TOOLS];

export interface Point {
  x: number;
  y: number;
}

export interface LineOverlay {
  type: typeof TOOLS.LINE;
  start: Point;
  end: Point;
}

export interface RectOverlay {
  type: typeof TOOLS.RECT;
  start: Point;
  end: Point;
}

export interface DotOverlay {
  type: typeof TOOLS.DOT;
  pos: Point;
}

export type Overlay = LineOverlay | RectOverlay | DotOverlay;
