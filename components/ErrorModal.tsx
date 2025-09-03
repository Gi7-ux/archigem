/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {X} from 'lucide-react';
import {parseError} from '../lib/utils';

/**
 * Props for the ErrorModal component.
 */
interface ErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

/**
 * A modal dialog to display an error message.
 * @param props The props for the component.
 * @returns The error modal component.
 */
export function ErrorModal({show, message, onClose}: ErrorModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-red-600">Generation Failed</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="font-medium text-gray-600">{parseError(message)}</p>
      </div>
    </div>
  );
}