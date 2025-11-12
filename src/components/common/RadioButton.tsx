
// components/common/RadioButton.tsx
import React from 'react';

interface RadioButtonProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  name: string;
  color?: 'cyan' | 'fuchsia' | 'indigo' | 'yellow' | 'red' | 'green';
  disabled?: boolean; // Added disabled prop
}

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  value,
  checked,
  onChange,
  name,
  color = 'cyan',
  disabled = false, // Set default value
}) => {
  const ringColorClass = `focus:ring-${color}-500`;
  const textColorClass = checked ? `text-${color}-300` : 'text-gray-400';
  const dotColorClass = `bg-${color}-500`;

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="radio"
        className="form-radio h-4 w-4 text-transparent border-gray-500 bg-gray-700/50 rounded-full focus:ring-offset-gray-900"
        style={{ '--tw-ring-color': checked ? `var(--tw-shadow-${color}-500)` : 'transparent' } as React.CSSProperties} // Custom ring color for checked state
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled} // Apply disabled prop
      />
      {checked && (
        <span className={`absolute w-2 h-2 rounded-full ${dotColorClass} pointer-events-none`} style={{ left: '6px', top: 'calc(50% - 4px)' }}></span>
      )}
      <span className={`ml-2 text-sm font-medium transition-colors ${textColorClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{label}</span>
    </label>
  );
};

export default RadioButton;
