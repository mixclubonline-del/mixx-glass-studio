

import React from 'react';

type IconProps = {
  className?: string;
};

/**
 * Transport & timeline icon suite
 * --------------------------------
 * Each glyph carries Mixx doctrines in miniature: Flow (continuous motion),
 * Reductionist Engineering (every stroke earns its pixel), and Mixx Recall
 * (memory cues baked into the geometry). Paths are authored so ALS temperature
 * gradients can latch onto outer energy arcs while inner cores express intent.
 */

export const PlayIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.35 6.05C7.58 3.98 9.84 2.9 12.08 2.9c3.12 0 5.98 1.9 7.21 4.84" />
      <path d="M6.35 17.95C7.58 20.02 9.84 21.1 12.08 21.1c3.12 0 5.98-1.9 7.21-4.84" />
    </g>
    <path
      fill="currentColor"
      d="M8.05 6.88c0-1.27 1.35-2.08 2.4-1.44l6.13 3.58c1.44.84 1.44 2.93 0 3.77l-6.13 3.58c-1.05.61-2.4-.17-2.4-1.44v-1.04c0-.69-.36-1.32-.94-1.67l-1.23-.74c-1.33-.8-1.33-2.75 0-3.55l1.23-.74c.58-.35.94-.98.94-1.67z"
    />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M5.1 7.1C6.48 4.53 9.08 3 12 3s5.52 1.53 6.9 4.1"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M5.1 16.9C6.48 19.47 9.08 21 12 21s5.52-1.53 6.9-4.1"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      fill="currentColor"
      d="M8.2 6.25c-.83 0-1.5.67-1.5 1.5v8.5c0 .83.67 1.5 1.5 1.5h.2c.83 0 1.5-.67 1.5-1.5v-8.5c0-.83-.67-1.5-1.5-1.5h-.2zm7.4 0c-.83 0-1.5.67-1.5 1.5v8.5c0 .83.67 1.5 1.5 1.5h.2c.83 0 1.5-.67 1.5-1.5v-8.5c0-.83-.67-1.5-1.5-1.5h-.2z"
    />
    <path
      d="M7 9.6c1.48-1.15 3.27-1.76 5-1.76 1.73 0 3.52.61 5 1.76"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const StarIcon: React.FC<{filled?: boolean} & IconProps> = ({ filled, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const SaveIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M6.35 7.45C7.65 4.94 10.1 3.6 12.8 3.6c3.86 0 7 3.09 7 6.9 0 3.81-3.14 6.9-7 6.9-1.83 0-3.37-.62-4.63-1.69"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 17.45c1.44 1.74 3.58 2.75 5.95 2.75 1.46 0 2.8-.42 3.93-1.12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fill="currentColor"
      d="M12 7.8a3.7 3.7 0 0 1 3.7 3.7 3.7 3.7 0 0 1-3.7 3.7c-1.03 0-1.98-.42-2.66-1.1l1.6-1.6a1.06 1.06 0 1 0-1.5-1.5l-1.6 1.6A3.7 3.7 0 0 1 12 7.8z"
    />
    <path
      d="M8.3 18.8h7.4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  </svg>
);

export const LoadIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M6.2 16.55c1.3 2.51 3.75 3.85 6.45 3.85 3.86 0 7-3.09 7-6.9 0-3.81-3.14-6.9-7-6.9-1.83 0-3.37.62-4.63 1.69"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.55 6.55C7.99 4.81 10.13 3.8 12.5 3.8c1.46 0 2.8.42 3.93 1.12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fill="currentColor"
      d="M12 6.2c-.6 0-1.1.49-1.1 1.1v4.15l-1.5-1.5a1.06 1.06 0 0 0-1.5 1.5l3.33 3.33a1.05 1.05 0 0 0 1.49 0l3.33-3.33a1.06 1.06 0 1 0-1.5-1.5l-1.5 1.5V7.3c0-.61-.49-1.1-1.05-1.1h-.01z"
    />
    <path
      d="M8.15 18.8h7.7"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  </svg>
);


export const ShuffleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001m-5.002.001a1.125 1.125 0 01-1.292 1.112L11.97 9.873m0 0l-2.5 2.25-1.5 1.75M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h4.992a8.25 8.25 0 01-11.667 0l-3.181 3.183m-4.992 0H5.006" />
    </svg>
);

export const VolumeIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const MixerIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4-2.4 3 3 0 001.128-5.78m1.128 5.78l1.723-1.723a3.75 3.75 0 004.242 0l1.723-1.723m-4.242 2.828a3.75 3.75 0 010-4.242l1.723-1.723a3.75 3.75 0 014.242 0l1.723 1.723a3.75 3.75 0 010 4.242l-1.723 1.723a3.75 3.75 0 01-4.242 0l-1.723-1.723z" />
    </svg>
);

export const MuteIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const SoloIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.25 7.25C19.25 9.45914 17.4591 11.25 15.25 11.25C13.0409 11.25 11.25 9.45914 11.25 7.25C11.25 5.04086 13.0409 3.25 15.25 3.25C17.4591 3.25 19.25 5.04086 19.25 7.25Z M11.25 16.75C11.25 14.5409 13.0409 12.75 15.25 12.75C17.4591 12.75 19.25 14.5409 19.25 16.75C19.25 18.9591 17.4591 20.75 15.25 20.75C13.0409 20.75 11.25 18.9591 11.25 16.75Z" transform="scale(1.2) translate(-2.5, -2.5)" />
    </svg>
);

export const RecordIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
        <circle cx="12" cy="12" r="8" />
    </svg>
);


export const PlusCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 4c2.45 0 4.58 1.3 5.84 3.3.93 1.47 1.2 3.29.61 4.95-.53 1.55-1.73 3.12-3.53 4.86l-1.94 1.94a1.08 1.08 0 0 1-1.54 0l-1.94-1.94c-1.8-1.74-3-3.31-3.53-4.86-.59-1.66-.32-3.48.61-4.95C7.42 5.3 9.55 4 12 4z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8.8v6.4m3.2-3.2H8.8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

export const SquaresPlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <rect
      x={3.2}
      y={5.6}
      width={11.1}
      height={5.3}
      rx={2.6}
      ry={2.6}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <rect
      x={4.6}
      y={13.2}
      width={7.9}
      height={4.7}
      rx={2.35}
      ry={2.35}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <circle cx={18.5} cy={14.7} r={2.6} fill="none" stroke="currentColor" strokeWidth={1.5} />
    <path
      d="M18.5 13.1v3.2m-1.6-1.6h3.2"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

export const ArrangeViewIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <rect
      x={3.5}
      y={6.2}
      width={5.8}
      height={11.6}
      rx={1.6}
      ry={1.6}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
    />
    <rect
      x={10.1}
      y={4.6}
      width={4.6}
      height={14.8}
      rx={1.6}
      ry={1.6}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
    />
    <rect
      x={15.8}
      y={8.2}
      width={4.7}
      height={7.9}
      rx={1.6}
      ry={1.6}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
    />
    <path
      d="M3.5 11.5h17"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.65}
    />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

export const DuplicateIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.375 3.375c-1.352 0-2.65.43-3.69 1.188M11.375 3.375V6.75m0-3.375c1.352 0 2.65.43 3.69 1.188m0-1.188a9 9 0 013.363 4.062M11.375 3.375c-1.352 0-2.65.43-3.69 1.188m-3.69 1.188A9 9 0 012.25 12c0 1.352.43 2.65 1.188 3.69m0 0a9 9 0 01-1.188 3.69m1.188-3.69a9 9 0 013.69 1.188m0 0V20.625m0-3.375c-1.352 0-2.65-.43-3.69-1.188m0 0a9 9 0 01-3.69-1.188m3.69 1.188a9 9 0 01-1.188-3.69m-1.188 3.69a9 9 0 01-3.363-4.062m14.25 8.124c-1.352 0-2.65-.43-3.69-1.188m3.69 1.188a9 9 0 013.363-4.062m0 0a9 9 0 01-3.363-4.062m0 0c1.352 0 2.65.43 3.69 1.188m0 0V6.75m0 3.375c-1.352 0-2.65-.43-3.69-1.188m0 0a9 9 0 01-3.69-1.188" />
    </svg>
);

export const BrainIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.25A6.375 6.375 0 0112 3c1.04 0 2.022.21 2.92.585m0 0a6.375 6.375 0 014.585 4.585m-4.585-4.585a12.75 12.75 0 00-9.17 9.17m9.17-9.17a12.75 12.75 0 01-9.17 9.17m9.17-9.17C14.022 5.21 15 6.96 15 9c0 1.04-.21 2.022-.585 2.92m-5.83 0A6.375 6.375 0 019 9c0-2.04.79-3.98 2.085-5.415M14.415 11.08A6.375 6.375 0 0115 15c0 2.04-.79 3.98-2.085 5.415m-2.83-5.415A6.375 6.375 0 019 15c0 2.04.79 3.98 2.085 5.415m0 0a12.75 12.75 0 009.17-9.17M9 15a12.75 12.75 0 00-9.17-9.17m0 0A12.75 12.75 0 003 12c0 3.73.938 7.202 2.585 10.085" />
    </svg>
);

export const SplitIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M4.2 15.4c1.72-2.54 4.38-3.77 7.8-3.77s6.08 1.23 7.8 3.77"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 5v14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    <path
      d="M7 9.4c1.5-.98 3.2-1.47 5-1.47 1.8 0 3.5.49 5 1.47"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
    />
    <path d="M9.6 5.8 12 4l2.4 1.8" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
  </svg>
);

export const MergeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M5.4 6.6c2.22 1.23 3.6 3.42 3.6 5.94v4.3c0 .88.72 1.6 1.6 1.6h3.2c.88 0 1.6-.72 1.6-1.6v-4.3c0-2.52 1.38-4.71 3.6-5.94"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.6 14.2h4.8c.66 0 1.2.54 1.2 1.2v1.2c0 .66-.54 1.2-1.2 1.2H9.6c-.66 0-1.2-.54-1.2-1.2v-1.2c0-.66.54-1.2 1.2-1.2z"
      fill="currentColor"
    />
    <path
      d="M8.2 8.7 12 12.5l3.8-3.8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M6.1 6.6c1.6-1.88 4-3.1 6.7-3.1 4.75 0 8.6 3.85 8.6 8.6 0 .42-.03.83-.1 1.24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.9 17.4c-1.6 1.88-4 3.1-6.7 3.1-4.75 0-8.6-3.85-8.6-8.6 0-.42.03-.83.1-1.24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6 9.2 3.6 11.6 6 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 14.8l2.4-2.4L18 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={12} cy={11.9} r={2} fill="currentColor" />
  </svg>
);


export const RewindIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M18.35 7.2C16.95 4.6 14.2 3 11.1 3 6.46 3 2.6 6.62 2.6 11.27c0 1.06.18 2.09.52 3.05"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fill="currentColor"
      d="M12.18 7.38a1 1 0 0 0-1.53.85v1.8l-3.73-2.38c-1.07-.68-2.47.09-2.47 1.34v5.82c0 1.25 1.4 2.01 2.47 1.34l3.73-2.38v1.8a1 1 0 0 0 1.53.85l5.61-3.6c.98-.63.98-2.08 0-2.7l-5.61-3.64z"
    />
  </svg>
);

export const FastForwardIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M5.65 7.2C7.05 4.6 9.8 3 12.9 3c4.64 0 8.5 3.62 8.5 8.27 0 1.06-.18 2.09-.52 3.05"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fill="currentColor"
      d="M11.82 7.38c.63-.4 1.45.07 1.45.85v1.8l3.73-2.38c1.07-.68 2.47.09 2.47 1.34v5.82c0 1.25-1.4 2.01-2.47 1.34l-3.73-2.38v1.8c0 .78-.82 1.25-1.45.85l-5.61-3.6c-.98-.63-.98-2.08 0-2.7l5.61-3.64z"
    />
  </svg>
);

export const LoopIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M6.25 9.5c1.4-1.92 3.4-3 5.75-3 2.35 0 4.34 1.08 5.75 3"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.75 14.5c-1.4 1.92-3.4 3-5.75 3-2.35 0-4.34-1.08-5.75-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.25 14.5c-1.63 0-2.95-1.32-2.95-2.95S4.62 8.6 6.25 8.6c2.58 0 4.16 2.9 5.75 2.9s3.17-2.9 5.75-2.9c1.63 0 2.95 1.32 2.95 2.95s-1.32 2.95-2.95 2.95"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.8 6.2 19.3 8.7 16.8 11.2"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PowerIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
);

export const ABIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const AutomationIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013.75 4.5h16.5a2.25 2.25 0 012.25 2.25v3M3.75 12a2.25 2.25 0 00-2.25 2.25v3.75a2.25 2.25 0 002.25 2.25h16.5a2.25 2.25 0 002.25-2.25v-3.75a2.25 2.25 0 00-2.25-2.25H3.75z" />
        <text x="12" y="8" fontFamily="sans-serif" fontSize="4" fill="currentColor" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">A</text>
    </svg>
);

export const SlidersIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M6.5 5.25h11a2.75 2.75 0 0 1 2.75 2.75v8c0 1.52-1.23 2.75-2.75 2.75h-11A2.75 2.75 0 0 1 3.75 16V8c0-1.52 1.23-2.75 2.75-2.75z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 7.5v9" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    <path d="M12.5 6v12" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    <path d="M16 8.5v7" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    <circle cx={9} cy={11.2} r={1.4} fill="currentColor" />
    <circle cx={12.5} cy={9} r={1.6} fill="currentColor" />
    <circle cx={16} cy={14.8} r={1.3} fill="currentColor" />
  </svg>
);

export const HushIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M4.2 12.4c0-3.74 2.76-6 7.8-6s7.8 2.26 7.8 6c0 2.05-1.24 3.85-3.29 4.83-.7.33-1.16 1.04-1.16 1.82v.55H8.65v-.55c0-.78-.46-1.49-1.16-1.82-2.05-.98-3.29-2.78-3.29-4.83z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.8 12c1.04-1.36 2.4-2.05 3.2-2.05s2.16.69 3.2 2.05"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
    />
    <path d="M12 8.4v7.4" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    <path d="M15.2 12h3.8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

// New icons for AI Hub and its features
export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3.8l1.05 3.4 3.45 1.05-3.45 1.05L12 12.7l-1.05-3.4-3.45-1.05 3.45-1.05L12 3.8z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <path
      d="M6.2 7.5c-1.4 2.5-1.4 6.5 2.6 8.2 2.2.9 3.2 2 3.2 3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
    />
    <path
      d="M17.8 7.5c1.4 2.5 1.4 6.5-2.6 8.2-2.2.9-3.2 2-3.2 3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
    />
    <circle cx={6.6} cy={5.8} r={1} fill="currentColor" />
    <circle cx={17.4} cy={5.8} r={1} fill="currentColor" />
  </svg>
);

export const ChatIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12L2.625 12V2.625h18.75V12H15.375M17.25 10.5V1.875M17.25 10.5h-10.5M17.25 10.5v10.5M17.25 10.5L12 15.75m0 0l-5.25-5.25m5.25 0v10.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V15a2.25 2.25 0 002.25 2.25h2.25M12 21a2.25 2.25 0 002.25-2.25V15M12 21v-4.75M12 21h4.56m-4.56 0c.42 0 .787-.207 1.011-.531m-.651-.979a2.25 2.25 0 001.011-.531M21.75 12.75V15a2.25 2.25 0 01-2.25 2.25h-2.56M21.75 12.75h-2.56m0 0a2.25 2.25 0 00-2.25 2.25M17.25 12.75V7.5M17.25 7.5h-10.5" />
  </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 18.75v-1.5a3 3 0 013-3h.75a3 3 0 013 3v1.5m-3 3l-1.5 3h3l-1.5-3z" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75L4.825 12.15a.75.75 0 01.97-.247l5.25 3.5a.75.75 0 01.73-.025L18.625 9.75M16.5 12a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4.5H19.5A2.25 2.25 0 0121.75 6.75V19.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5V6.75A2.25 2.25 0 014.5 4.5z" />
  </svg>
);

export const SpeakerWaveIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export const BulbIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M4.6 12c1.8-3.6 4.8-5.7 7.4-5.7 2.6 0 5.6 2.1 7.4 5.7-1.8 3.6-4.8 5.7-7.4 5.7-2.6 0-5.6-2.1-7.4-5.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 7.4v9.2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    <path d="M9 18.6h6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    <circle cx={12} cy={12} r={1.7} fill="currentColor" />
    <path d="M6.4 8.7c2.2 1 3.6 2.8 3.6 5.1" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    <path d="M17.6 8.7c-2.2 1-3.6 2.8-3.6 5.1" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
  </svg>
);