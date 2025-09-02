/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CircleDot,
  Download,
  Hand,
  Minus,
  Redo,
  Square,
  Trash2,
  Undo,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {TOOLS} from '../constants';
import {ToolButton} from './ToolButton';

export function Toolbar({
  fileInputRef,
  handleImageUpload,
  activeTool,
  setActiveTool,
  handleUndo,
  canUndo,
  handleRedo,
  canRedo,
  handleZoomIn,
  handleZoomOut,
  clearOverlays,
  baseImage,
  handleDownloadPNG,
  handleDownloadPDF,
}) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [downloadMenuRef]);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
          AI Building Plan Editor
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Upload a plan, use the tools to mark changes, and prompt Gemini to
          edit.
        </p>
      </div>

      <menu className="flex items-center flex-wrap gap-2 bg-gray-200 rounded-full p-2 shadow-sm self-start sm:self-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 px-4 rounded-full flex items-center justify-center bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600">
          <Upload className="w-5 h-5 mr-2" />
          Upload Plan
        </button>
        <div className="flex items-center gap-1 bg-white/50 rounded-full p-1">
          <ToolButton
            onClick={() => setActiveTool(TOOLS.PAN)}
            isActive={activeTool === TOOLS.PAN}
            label="Pan Tool">
            <Hand className="w-5 h-5" />
          </ToolButton>
          <ToolButton
            onClick={() => setActiveTool(TOOLS.LINE)}
            isActive={activeTool === TOOLS.LINE}
            label="Line Tool">
            <Minus className="w-5 h-5" />
          </ToolButton>
          <ToolButton
            onClick={() => setActiveTool(TOOLS.RECT)}
            isActive={activeTool === TOOLS.RECT}
            label="Rectangle Tool">
            <Square className="w-5 h-5" />
          </ToolButton>
          <ToolButton
            onClick={() => setActiveTool(TOOLS.DOT)}
            isActive={activeTool === TOOLS.DOT}
            label="Marker Tool">
            <CircleDot className="w-5 h-5" />
          </ToolButton>
        </div>
        <div className="flex items-center gap-1 bg-white/50 rounded-full p-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white disabled:opacity-50 hover:bg-gray-100"
            title="Undo">
            <Undo className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white disabled:opacity-50 hover:bg-gray-100"
            title="Redo">
            <Redo className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white/50 rounded-full p-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-gray-100"
            title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-gray-100"
            title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={clearOverlays}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-100 hover:scale-110"
          title="Clear Markings">
          <Trash2 className="w-5 h-5 text-gray-700" />
        </button>

        <div className="relative" ref={downloadMenuRef}>
          <button
            type="button"
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={!baseImage}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download">
            <Download className="w-5 h-5 text-gray-700" />
          </button>
          {showDownloadMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
              <button
                onClick={() => {
                  handleDownloadPNG();
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Download PNG
              </button>
              <button
                onClick={() => {
                  handleDownloadPDF();
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Download PDF
              </button>
            </div>
          )}
        </div>
      </menu>
    </div>
  );
}