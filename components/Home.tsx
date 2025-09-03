/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import jsPDF from 'jspdf';
import {useRef, useState} from 'react';
import {A0_HEIGHT_PX, A0_WIDTH_PX} from '../constants';
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

    const {naturalWidth: imgWidth, naturalHeight: imgHeight} = baseImageElement;

    if (format === 'png') {
      // For PNG, create a high-resolution image for printing
      const isLandscape = imgWidth > imgHeight;
      const targetWidth = isLandscape ? A0_HEIGHT_PX : A0_WIDTH_PX;
      const targetHeight = isLandscape ? A0_WIDTH_PX : A0_HEIGHT_PX;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill background with white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling and centering
      const imgAspectRatio = imgWidth / imgHeight;
      const canvasAspectRatio = canvas.width / canvas.height;
      let drawWidth, drawHeight, x, y;

      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas aspect ratio
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspectRatio;
        x = 0;
        y = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than or equal to canvas aspect ratio
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspectRatio;
        x = (canvas.width - drawWidth) / 2;
        y = 0;
      }

      // Draw the base image
      ctx.drawImage(baseImageElement, x, y, drawWidth, drawHeight);

      // Draw the overlays, scaled and translated
      const scale = drawWidth / imgWidth;
      drawOverlays(ctx, overlays, scale, x, y);

      // Trigger download
      const link = document.createElement('a');
      link.download = 'building-plan.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (format === 'pdf') {
      // For PDF, create an A0-sized PDF and fit the image within it
      const isLandscape = imgWidth > imgHeight;
      const orientation = isLandscape ? 'l' : 'p';

      // Create a canvas with the original image dimensions to draw on
      const canvas = document.createElement('canvas');
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImageElement, 0, 0);
      drawOverlays(ctx, overlays, 1); // Draw overlays at original scale

      const imgData = canvas.toDataURL('image/png');

      // Create a new jsPDF instance with A0 format
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a0',
      });

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Calculate the aspect ratio of the image and the PDF page
      const imgAspectRatio = imgWidth / imgHeight;
      const pdfAspectRatio = pdfWidth / pdfHeight;

      let renderWidth, renderHeight;

      if (imgAspectRatio > pdfAspectRatio) {
        // Image is wider than the PDF page, so fit to width
        renderWidth = pdfWidth;
        renderHeight = renderWidth / imgAspectRatio;
      } else {
        // Image is taller than or same aspect as the PDF page, so fit to height
        renderHeight = pdfHeight;
        renderWidth = renderHeight * imgAspectRatio;
      }

      // Center the image on the page
      const x = (pdfWidth - renderWidth) / 2;
      const y = (pdfHeight - renderHeight) / 2;

      doc.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
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