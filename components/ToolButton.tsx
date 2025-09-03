import {MouseEventHandler, ReactNode} from 'react';

/**
 * Props for the ToolButton component.
 */
interface ToolButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  isActive?: boolean;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * A button for a tool in the toolbar.
 * @param props The props for the component.
 * @returns The tool button component.
 */
export const ToolButton = ({
  onClick,
  isActive,
  label,
  children,
  disabled,
}: ToolButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:bg-gray-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
      isActive ? 'bg-blue-100 text-blue-600' : 'bg-white'
    }`}
    aria-label={label}
    title={label}>
    {children}
  </button>
);
