import type { SVGProps } from "react";

type IconName =
  | "sparkles"
  | "mail"
  | "lock"
  | "user"
  | "arrowRight"
  | "arrowLeft"
  | "plus"
  | "image"
  | "logout"
  | "moon"
  | "sun"
  | "close"
  | "bolt"
  | "download"
  | "history"
  | "folder"
  | "settings"
  | "credit"
  | "info"
  | "trash"
  | "undo"
  | "redo"
  | "lasso"
  | "home"
  | "search"
  | "bell"
  | "upload"
  | "layers"
  | "more"
  | "grid"
  | "list"
  | "cpu"
  | "eye"
  | "eyeOff"
  | "wand"
  | "eraser"
  | "film"
  | "crop"
  | "paintBucket"
  | "faceSmile"
  | "cursor"
  | "brush"
  | "pen"
  | "pencil"
  | "marker"
  | "airbrush"
  | "smudge"
  | "zoomIn"
  | "sliders"
  | "scissors"
  | "contrast"
  | "droplet"
  | "palette"
  | "menu"
  | "globe";

const paths: Record<IconName, React.ReactNode> = {
  sparkles: (
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6L5 12l6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-6 6-4-4-3 3" />
    </>
  ),
  logout: <path d="M15 17l5-5-5-5M20 12H9M12 19H5V5h7" />,
  moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  close: <path d="M18 6L6 18M6 6l12 12" />,
  bolt: <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />,
  download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />,
  history: (
    <>
      <path d="M3 12a9 9 0 109-9" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  credit: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />,
  undo: <path d="M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-2" />,
  redo: <path d="M15 14l4-4-4-4M19 10h-9a5 5 0 000 10h2" />,
  lasso: (
    <>
      <path d="M4 4 C 20 4 20 17 12 17 C 5 17 5 10 12 10 C 17 10 18 14 15 15" strokeDasharray="2 2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17 v2" />
    </>
  ),
  home: <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16a6 6 0 00-6-11 6 6 0 00-6 6c0 3-1 4-2 5h16c-1-1-2-2-2-5z" />
      <path d="M10 21a2 2 0 004 0" />
    </>
  ),
  upload: <path d="M12 21V9m0 0l-4 4m4-4l4 4M5 3h14" />,
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 7V4M12 7V4M15 7V4M9 17v3M12 17v3M15 17v3M7 9H4M7 12H4M7 15H4M17 9h3M17 12h3M17 15h3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4l5 5L8 21l-5-5L15 4z" />
      <path d="M20 7l1-3 1 3-3 1 3 1-1 3-1-3 3-1-3-1z" />
    </>
  ),
  eraser: (
    <>
      <path d="M20 20H7L3 16l11-11 7 7-1 8z" />
      <path d="M6 14l8-8" />
    </>
  ),
  film: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  crop: (
    <>
      <path d="M6 2v14a2 2 0 002 2h14" />
      <path d="M2 6h14a2 2 0 012 2v14" />
    </>
  ),
  paintBucket: (
    <>
      <path d="M19 11c0 1.66-2 3-2 3s-2-1.34-2-3a2 2 0 014 0z" />
      <path d="M3 3l7 7-6.5 6.5a2.12 2.12 0 000 3h0a2.12 2.12 0 003 0L13 13 3 3z" />
      <path d="M10 10L4 4" />
    </>
  ),
  faceSmile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14s1.5 2 3.5 2 3.5-2 3.5-2" />
      <circle cx="9" cy="10" r="0.5" fill="currentColor" />
      <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </>
  ),
  cursor: (
    <path d="M5 3l14 9-7.5 1.5L8 21 5 3z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  ),
  brush: (
    <>
      <path d="M9.5 14.5L16 4l3 2-6.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 14.5c-.8 1-.8 2.5.5 3 1 .4 2-.2 2.5-1" strokeLinecap="round" />
      <path d="M3 20c1-1 2.5-1.5 4-.5" strokeLinecap="round" />
    </>
  ),
  pen: (
    <>
      <path d="M17 3l4 4-13 13H4v-4L17 3z" strokeLinejoin="round" />
      <path d="M14 6l4 4" />
    </>
  ),
  pencil: (
    <>
      <path d="M15.5 3.5l5 5L7 22H2v-5L15.5 3.5z" strokeLinejoin="round" />
      <path d="M13 6l5 5" />
      <path d="M2 17l5 5" />
    </>
  ),
  marker: (
    <>
      <rect x="9" y="2" width="6" height="10" rx="2" />
      <path d="M12 12v10" strokeLinecap="round" />
      <path d="M10 19l2 3 2-3" strokeLinejoin="round" />
    </>
  ),
  airbrush: (
    <>
      <path d="M3 12h6M12 3v6M6.3 6.3l4.2 4.2M17.7 6.3l-4.2 4.2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="4" />
      <path d="M12 18v3" strokeLinecap="round" />
    </>
  ),
  smudge: (
    <>
      <path d="M4 20c4-8 12-12 16-8-4 0-8 4-8 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12c2-3 5-4 7-2" strokeLinecap="round" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </>
  ),
  sliders: (
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 5.5h6M17 18.5h6" />
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
    </>
  ),
  droplet: (
    <path d="M12 2L6 12a6 6 0 0012 0L12 2z" />
  ),
  palette: (
    <>
      <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0010 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.4C20.5 17 22 14.7 22 12c0-5.5-4.5-10-10-10z" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.5 2.5-4 5.5-4 9s1.5 6.5 4 9M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9M3 12h18" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

export type { IconName };
