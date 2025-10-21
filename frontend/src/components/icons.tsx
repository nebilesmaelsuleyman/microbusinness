/* Lightweight inline SVG icons (stroke-based, inherit currentColor). */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
export const IconMapPin = (p: P) => (<svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);
export const IconStar = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" /></svg>);
export const IconStarOutline = (p: P) => (<svg {...base(p)}><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" /></svg>);
export const IconHeart = (p: P) => (<svg {...base(p)}><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5a4.5 4.5 0 0 0-10 3.5C2 12 7 17 12 21c2-1.6 4-3.3 5.5-4.8" /></svg>);
export const IconHeartFill = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 21s-8-5-10-10A5 5 0 0 1 12 6a5 5 0 0 1 10 5c-2 5-10 10-10 10Z" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>);
export const IconCheckCircle = (p: P) => (<svg {...base(p)}><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="m22 4-10 10.1-3-3" /></svg>);
export const IconShieldCheck = (p: P) => (<svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconX = (p: P) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const IconPhone = (p: P) => (<svg {...base(p)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>);
export const IconBriefcase = (p: P) => (<svg {...base(p)}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>);
export const IconUser = (p: P) => (<svg {...base(p)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
export const IconUsers = (p: P) => (<svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11" /></svg>);
export const IconLogout = (p: P) => (<svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>);
export const IconSettings = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></svg>);
export const IconLayout = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>);
export const IconShield = (p: P) => (<svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>);
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
export const IconDollar = (p: P) => (<svg {...base(p)}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
export const IconTrending = (p: P) => (<svg {...base(p)}><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>);
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconChevronDown = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const IconArrowRight = (p: P) => (<svg {...base(p)}><path d="M5 12h14M12 5l7 7-7 7" /></svg>);
export const IconInfo = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);
export const IconAlert = (p: P) => (<svg {...base(p)}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>);
export const IconUpload = (p: P) => (<svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>);
export const IconDoc = (p: P) => (<svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>);
export const IconTag = (p: P) => (<svg {...base(p)}><path d="M2 7.5V4a2 2 0 0 1 2-2h3.5a2 2 0 0 1 1.4.6l9.5 9.5a2 2 0 0 1 0 2.8l-3.5 3.5a2 2 0 0 1-2.8 0L2.6 8.9A2 2 0 0 1 2 7.5Z" /><path d="M6.5 6.5h.01" /></svg>);
export const IconSparkle = (p: P) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>);
export const IconBolt = (p: P) => (<svg {...base(p)}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>);
export const IconGrid = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>);
export const IconInbox = (p: P) => (<svg {...base(p)}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" /></svg>);
export const IconHome = (p: P) => (<svg {...base(p)}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></svg>);

/* ── Service-specific icons ── */
export const IconWrench = (p: P) => (<svg {...base(p)}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" /></svg>);
export const IconZap = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" /></svg>);
export const IconPaintbrush = (p: P) => (<svg {...base(p)}><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" /><path d="M9 8c-2 2.5-2 5-1 7.5C5.61 16 5 17 5 19a2 2 0 0 0 4 0c1-1 2-1.5 3-2-2.5-1-3.5-3-3-5Z" /><path d="m14.5 17.5 5 5" /></svg>);
export const IconSpray = (p: P) => (<svg {...base(p)}><path d="M3 3h.01M7 5h.01M11 7h.01M3 7h.01M7 3h.01M16 16c.5-3.5 2-6 4-8" /><path d="M10.5 10.5C9 12 9 14 10 16c1 2 3 3 5 3 .5-2.5.5-4.5-.5-6" /><path d="M14.5 5.5C15.5 4 15 2.5 14 2c-.5 2.5-.5 4.5.5 5.5" /></svg>);
export const IconHammer = (p: P) => (<svg {...base(p)}><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" /></svg>);
export const IconTree = (p: P) => (<svg {...base(p)}><path d="M17 14v6" /><path d="M13 14v6" /><path d="M19 22H11" /><path d="M15 4a2 2 0 0 0-2 2c0 1.5 1 2.5 2 3 1-.5 2-1.5 2-3a2 2 0 0 0-2-2Z" /><path d="M9 8c0-1.5 1-3 3-3.5" /><path d="M9 8c0 1.5.5 3 2 4.5" /><path d="M21 8c0-1.5-1-3-3-3.5" /><path d="M21 8c0 1.5-.5 3-2 4.5" /><path d="M9 12.5c-1 1-2.5 2-4 2 1 0 3 .5 4 2" /><path d="M21 12.5c1 1 2.5 2 4 2-1 0-3 .5-4 2" /></svg>);
export const IconCamera = (p: P) => (<svg {...base(p)}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="3" /></svg>);
export const IconTruck = (p: P) => (<svg {...base(p)}><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v9" /><path d="M14 8h4l3 6v3h-2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>);
export const IconScissors = (p: P) => (<svg {...base(p)}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></svg>);
export const IconActivity = (p: P) => (<svg {...base(p)}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>);
export const IconDroplets = (p: P) => (<svg {...base(p)}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05Z" /><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" /></svg>);
export const IconSun = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>);
export const IconWifi = (p: P) => (<svg {...base(p)}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 16 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></svg>);
