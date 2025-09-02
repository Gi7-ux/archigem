/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import jsPDF from 'jspdf';
import {useRef, useState} from 'react';
import {useCanvas} from '../hooks/useCanvas';
import {generateImageFromPlan} from '../lib/gemini';
import {drawOverlays} from '../lib/utils';
import {Canvas} from './Canvas';
import {ErrorModal} from './ErrorModal';
import {PromptForm} from './PromptForm';
import {Toolbar} from './Toolbar';

export default function Home() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const [baseImage, setBaseImage] = useState(null);
  const [baseImageElement, setBaseImageElement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
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
    canvasHandlers,
    undo,
    redo,
    zoomIn,
    zoomOut,
    clearOverlays,
    resetCanvasState,
  } = useCanvas(canvasRef);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          setBaseImageElement(img);
          resetCanvasState();
        };
        img.src = reader.result as string;
        setBaseImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseImageElement || !prompt.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setShowErrorModal(false);

    try {
      const newImageDataUrl = await generateImageFromPlan(
        baseImageElement,
        overlays,
        prompt,
      );
      setBaseImage(newImageDataUrl); // This will trigger the useEffect in useCanvas to redraw
      const img = new window.Image();
      img.onload = () => {
        setBaseImageElement(img);
        clearOverlays(true); // Clear overlays for the new image
      };
      img.src = newImageDataUrl;
    } catch (error) {
      console.error('Error submitting drawing:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const createAndDownloadImage = (format) => {
    if (!baseImageElement) return;

    const canvas = document.createElement('canvas');
    canvas.width = baseImageElement.naturalWidth;
    canvas.height = baseImageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(baseImageElement, 0, 0);
    drawOverlays(ctx, overlays, 1);

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = 'building-plan.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const orientation = imgWidth > imgHeight ? 'l' : 'p';
      const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [imgWidth, imgHeight],
      });
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      doc.save('building-plan.pdf');
    }
  };

  const handleDownloadPNG = () => createAndDownloadImage('png');
  const handleDownloadPDF = () => createAndDownloadImage('pdf');

  return (
    <>
      <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col justify-start items-center">
        <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 pb-32 max-w-7xl w-full flex flex-col">
          <Toolbar
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            handleUndo={undo}
            canUndo={historyIndex > 0}
            handleRedo={redo}
            canRedo={historyIndex < history.length - 1}
            handleZoomIn={zoomIn}
            handleZoomOut={zoomOut}
            clearOverlays={() => clearOverlays(false)}
            baseImage={baseImage}
            handleDownloadPNG={handleDownloadPNG}
            handleDownloadPDF={handleDownloadPDF}
          />

          <div
            className="w-full flex-grow border-2 border-gray-400 border-dashed rounded-lg bg-white/80"
            style={{minHeight: '50vh'}}>
            <Canvas
              canvasRef={canvasRef}
              baseImage={baseImage}
              baseImageElement={baseImageElement}
              activeTool={activeTool}
              overlays={overlays}
              panOffset={panOffset}
              zoom={zoom}
              currentDrawing={currentDrawing}
              snapIndicator={snapIndicator}
              canvasHandlers={canvasHandlers}
            />
          </div>

          <PromptForm
            prompt={prompt}
            setPrompt={setPrompt}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            baseImage={baseImage}
          />
        </main>
        <ErrorModal
          show={showErrorModal}
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </div>
    </>
  );
}