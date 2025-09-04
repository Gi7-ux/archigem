/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, Modality} from '@google/genai';
import {Overlay} from '../types';
import {drawOverlays} from './utils';

// Use the API key from environment variables as per guidelines
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export async function generateImageFromPlan(
  baseImageElement: HTMLImageElement,
  overlays: Overlay[],
  prompt: string,
): Promise<string> {
  // Create a temporary canvas to compose the final image for the API
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = baseImageElement.width;
  tempCanvas.height = baseImageElement.height;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('Could not get canvas context');
  }

  // Draw base image
  tempCtx.drawImage(baseImageElement, 0, 0);

  // Draw overlays on top
  drawOverlays(tempCtx, overlays, 1); // Draw overlays at 1x zoom for the API

  const compositeImageData = tempCanvas.toDataURL('image/png').split(',')[1];

  const model = 'gemini-2.5-flash-image-preview';

  const contents = {
    parts: [
      {
        inlineData: {
          data: compositeImageData,
          mimeType: 'image/png',
        },
      },
      {
        text: `You are an expert architect's assistant editing a 2D building plan. The user wants to: '${prompt}'. I have marked the area of change on the image with semi-transparent red overlays. Apply this change while perfectly matching the original image's style (line weight, color, texture). **Crucially, do not alter any text, dimensions, or unchanged parts of the plan.**`,
      },
    ],
  };

  const response = await ai.models.generateContent({
    model: model,
    contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const newImageData = part.inlineData.data;
        return `data:image/png;base64,${newImageData}`;
      }
    }
  }

  throw new Error('No image was generated. Please try a different prompt.');
}
