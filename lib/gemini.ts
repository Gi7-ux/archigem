/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, Modality} from '@google/genai';
import {drawOverlays} from './utils';

// Use the API key from environment variables as per guidelines
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export async function generateImageFromPlan(baseImageElement, overlays, prompt) {
  // Create a canvas for the clean base image
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = baseImageElement.width;
  baseCanvas.height = baseImageElement.height;
  const baseCtx = baseCanvas.getContext('2d');
  baseCtx.drawImage(baseImageElement, 0, 0);
  const baseImageData = baseCanvas.toDataURL('image/png').split(',')[1];

  // Create a canvas for the composite image (with overlays)
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = baseImageElement.width;
  compositeCanvas.height = baseImageElement.height;
  const compositeCtx = compositeCanvas.getContext('2d');
  compositeCtx.drawImage(baseImageElement, 0, 0);
  drawOverlays(compositeCtx, overlays, 1);
  const compositeImageData = compositeCanvas
    .toDataURL('image/png')
    .split(',')[1];

  // Create a canvas for the in-painting mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = baseImageElement.width;
  maskCanvas.height = baseImageElement.height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.fillStyle = 'black';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  drawOverlays(maskCtx, overlays, 1, 0, 0, true); // Draw white-filled overlays for the mask
  const maskImageData = maskCanvas.toDataURL('image/png').split(',')[1];

  const model = 'gemini-2.5-flash-image-preview';

  const contents = {
    parts: [
      {
        inlineData: {
          data: baseImageData,
          mimeType: 'image/png',
        },
      },
      {
        inlineData: {
          data: compositeImageData,
          mimeType: 'image/png',
        },
      },
      {
        inlineData: {
          data: maskImageData,
          mimeType: 'image/png',
        },
      },
      {
        text: `You are an expert AI architect's assistant. Your task is to edit a 2D building plan using in-painting.

I am providing you with three images:
*   **Image 1:** The original, clean building plan. Use this as a reference for the style (line weight, color, texture, etc.).
*   **Image 2:** The same plan, but with red overlays marking the areas to be modified for your reference.
*   **Image 3:** A black and white in-painting mask. You must only edit the **white areas** of this mask.

**Instructions:**

1.  **Analyze the Request:** The user wants to: '${prompt}'.
2.  **Locate the Area of Change:** The areas for modification are marked in white in Image 3 (the mask).
3.  **Apply the Changes (In-painting):**
    *   Execute the user's request **only within the white areas of the mask (Image 3)**.
    *   The final output must be a seamless modification of the original plan from Image 1.
4.  **Maintain Style Consistency:**
    *   **Perfectly match the style of Image 1.** This includes, but is not limited to:
        *   **Line Weight:** All new lines must have the same thickness and density as the existing lines in the plan.
        *   **Color:** Use the exact same colors as the original plan. For black and white plans, use pure black and white.
        *   **Texture:** If the original plan has any textures (e.g., for walls, floors), the new elements must replicate this texture.
        *   **Architectural Symbols:** Use standard architectural symbols that are consistent with the existing ones.
5.  **Strict Preservation Constraints:**
    *   **DO NOT alter any part of the plan that falls within the black areas of the mask (Image 3).** The black areas must remain completely untouched.
    *   **DO NOT change, move, or delete any text, labels, or dimensions.** These elements are critical and must be preserved in their original state and position.
    *   **The red overlays in Image 2 and the white areas in Image 3 are for guidance only.** They must not appear in the final output image.

Your goal is to produce a clean, professional, and precise architectural drawing that incorporates the user's changes as if they were part of the original design.`,
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
