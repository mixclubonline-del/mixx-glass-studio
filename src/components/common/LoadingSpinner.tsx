// components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  color?: string; // e.g., 'cyan', 'fuchsia'
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', color = 'cyan', size = 'md' }) => {
  const spinnerSize = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  }[size];

  const spinnerColor = {
    cyan: 'border-cyan-400 border-t-transparent',
    fuchsia: 'border-fuchsia-400 border-t-transparent',
    indigo: 'border-indigo-400 border-t-transparent',
    yellow: 'border-yellow-400 border-t-transparent',
    red: 'border-red-400 border-t-transparent',
    green: 'border-green-400 border-t-transparent',
  }[color];

  const messageClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${spinnerSize} ${spinnerColor} rounded-full animate-spin mb-4`}></div>
      <p className={`text-gray-300 font-mono tracking-wide ${messageClasses}`}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
