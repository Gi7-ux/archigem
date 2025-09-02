/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export const ToolButton = ({
  onClick,
  isActive,
  label,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:bg-gray-100 hover:scale-110 ${
      isActive ? 'bg-blue-100 text-blue-600' : 'bg-white'
    }`}
    aria-label={label}
    title={label}>
    {children}
  </button>
);
