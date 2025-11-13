
// A simple utility to conditionally join class names, similar to 'clsx' or 'classnames'
export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}