

import React from 'react';

type IconProps = {
  className?: string;
};

export const PlayIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" transform="rotate(180 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.598 11.637a3.374 3.374 0 01-4.794 4.755 3.374 3.374 0 01-4.755-4.794 3.374 3.374 0 014.794-4.755 3.374 3.374 0 014.755 4.794z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
);

export const LoadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SquaresPlusIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125A2.25 2.25 0 014.5 4.875h15A2.25 2.25 0 0121.75 7.125v1.518a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V7.125zM2.25 15.125A2.25 2.25 0 014.5 12.875h15a2.25 2.25 0 012.25 2.25v1.518a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V15.125z" />
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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M3 12h1m16 0h1M12 3v1m0 16v1M5.636 5.636l.707.707m12.021 12.021l.707.707M18.364 5.636l-.707.707M6.343 18.364l-.707.707" />
    </svg>
);


export const RewindIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z" />
    </svg>
);

export const FastForwardIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
    </svg>
);

export const LoopIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001m-5.002.001a1.125 1.125 0 01-1.292 1.112L11.97 9.873m0 0l-2.5 2.25-1.5 1.75M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h4.992a8.25 8.25 0 01-11.667 0l-3.181 3.183m-4.992 0H5.006" />
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export const HushIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c2-3 4-3 6 0s4 3 6 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h6" />
  </svg>
);

// New icons for AI Hub and its features
export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846m4.704-1.23l1.102-1.102L17.5 12l-2.613 2.613m-4.704 1.23l-1.102 1.102L6.5 18l2.613-2.613m-1.23-4.704l-1.102 1.102L4.5 12l2.613 2.613m11.334-12.814l.813 2.846L21 6l-2.846-.813m-4.704-1.23l-1.102-1.102L12 6.5l2.613-2.613m-1.23-4.704l-1.102 1.102L12 4.5l-2.613-2.613m-1.23-4.704l-.813 2.846L3 6l2.846-.813" />
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18V6l-3-3m0 0H6m3 0H12m6 3h-3m3 0v12c0 1.657-1.343 3-3 3H9c-1.657 0-3-1.343-3-3V6c0-1.657 1.343-3 3-3h3m0 0l3 3m-3-3v18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" />
  </svg>
);