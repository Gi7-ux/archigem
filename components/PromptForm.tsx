/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {LoaderCircle, SendHorizontal} from 'lucide-react';
import {Dispatch, FormEvent, SetStateAction} from 'react';

/**
 * Props for the PromptForm component.
 */
interface PromptFormProps {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  baseImage: string | null;
}

/**
 * A form for submitting prompts to the AI model.
 * @param props The props for the component.
 * @returns The prompt form component.
 */
export function PromptForm({
  prompt,
  setPrompt,
  handleSubmit,
  isLoading,
  baseImage,
}: PromptFormProps) {
  return (
    <form onSubmit={handleSubmit} className="w-full mt-6">
      <div className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            baseImage
              ? 'e.g., "Add a window on the north wall"'
              : 'Upload a plan to start editing...'
          }
          className="w-full p-3 sm:p-4 pr-12 sm:pr-14 text-sm sm:text-base border-2 border-gray-400 bg-white text-gray-800 shadow-sm rounded-md focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all"
          required
          disabled={!baseImage || isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !baseImage || !prompt.trim()}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-md bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
          {isLoading ? (
            <LoaderCircle
              className="w-5 sm:w-6 h-5 sm:h-6 animate-spin"
              aria-label="Loading"
            />
          ) : (
            <SendHorizontal
              className="w-5 sm:w-6 h-5 sm:h-6"
              aria-label="Submit"
            />
          )}
        </button>
      </div>
    </form>
  );
}