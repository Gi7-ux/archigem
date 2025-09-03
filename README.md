<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Building Plan Editor

The AI Building Plan Editor is a web-based application that allows users to upload, edit, and modify 2D building plans using the power of generative AI. Users can mark up plans with drawing tools and then use natural language prompts to have an AI assistant make changes to the plan.

## About the Project

This application provides an intuitive interface for architects, engineers, and designers to collaborate with an AI assistant. It streamlines the process of making architectural edits by combining familiar drawing tools with the advanced capabilities of the Gemini AI model. Users can upload a plan, draw lines, rectangles, or markers to indicate areas of change, and then provide a text prompt to describe the desired modification. The AI then generates a new version of the plan with the requested changes applied seamlessly.

## Features

-   **Image Upload**: Upload any 2D building plan image (PNG, JPG, etc.) to get started.
-   **Drawing Tools**: Mark up the plan using a variety of tools:
    -   **Pan**: Navigate around the canvas.
    -   **Line**: Draw lines to indicate walls or other linear features.
    -   **Rectangle**: Draw rectangles to outline areas.
    -   **Marker**: Place dots to highlight specific points.
-   **AI-Powered Editing**: Use text prompts to instruct the Gemini AI model to make changes to the plan.
-   **Undo/Redo**: Easily undo and redo actions.
-   **Zoom**: Zoom in and out for precise editing.
-   **Export**: Download the modified plan as a high-resolution PNG or a multi-page PDF.

## How It Works

The application is built with a modern web stack:

-   **Frontend**: Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/).
-   **AI Model**: Uses the [Google Gemini API](https://ai.google.dev/) for generative image editing.
-   **Canvas**: The HTML5 Canvas API is used for all drawing and user interactions.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) is used for styling the user interface.

When a user submits a prompt, the application sends the base image, a mask generated from the user's drawings, and the text prompt to the Gemini API. The API then returns a new image with the requested edits, which is then displayed to the user.

## File Structure

```
.
├── components/         # React components
│   ├── Canvas.tsx      # The main canvas for drawing
│   ├── ErrorModal.tsx  # Modal for displaying errors
│   ├── Home.tsx        # The main application component
│   ├── PromptForm.tsx  # The form for submitting prompts
│   ├── ToolButton.tsx  # A button for the toolbar
│   └── Toolbar.tsx     # The main toolbar
├── hooks/              # Custom React hooks
│   └── useCanvas.ts    # Hook for managing canvas state
├── lib/                # Libraries and utility functions
│   ├── gemini.ts       # Gemini API integration
│   └── utils.ts        # Utility functions
├── public/             # Public assets
├── src/                # Main source code
│   ├── index.css       # Main stylesheet
│   ├── index.tsx       # Main entry point
│   └── ...
├── .gitignore
├── index.html
├── package.json
├── README.md
└── ...
```

## Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/)

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set the `GEMINI_API_KEY` in a `.env` file. You can copy the `.env.example` file to `.env` and add your key:
    ```
    VITE_GEMINI_API_KEY=your_api_key
    ```
4.  Run the app:
    ```bash
    npm run dev
    ```
5.  Open your browser to `http://localhost:5173/` (or the address shown in your terminal).
