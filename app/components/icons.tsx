import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Line({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="3" width="7.5" height="9" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="2" />
    <rect x="3" y="15" width="7.5" height="6" rx="2" />
  </Line>
);

export const IconHome = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
  </Line>
);

export const IconDocument = (p: IconProps) => (
  <Line {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Line>
);

export const IconCalendar = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M8 14h2M14 14h2M8 17.5h2" />
  </Line>
);

export const IconClock = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Line>
);

export const IconBell = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Line>
);

export const IconClipboard = (p: IconProps) => (
  <Line {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1Z" />
    <path d="m9 13 2 2 4-4" />
  </Line>
);

export const IconInbox = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5.5 5h13L21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
  </Line>
);

export const IconScroll = (p: IconProps) => (
  <Line {...p}>
    <path d="M8 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8" />
    <path d="M8 3a2 2 0 0 0-2 2v14a2 2 0 0 1-2 2h4" />
    <path d="M11 8h5M11 12h5M11 16h3" />
  </Line>
);

export const IconShield = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
    <path d="m9 12 2 2 4-4" />
  </Line>
);

export const IconLogout = (p: IconProps) => (
  <Line {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </Line>
);

export const IconMenu = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Line>
);

export const IconClose = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Line>
);

export const IconCheck = (p: IconProps) => (
  <Line {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Line>
);

export const IconCheckCircle = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.8 2.8L16.5 9.5" />
  </Line>
);

export const IconXCircle = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Line>
);

export const IconChevronLeft = (p: IconProps) => (
  <Line {...p}>
    <path d="m15 6-6 6 6 6" />
  </Line>
);

export const IconChevronRight = (p: IconProps) => (
  <Line {...p}>
    <path d="m9 6 6 6-6 6" />
  </Line>
);

export const IconArrowRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Line>
);

export const IconArrowLeft = (p: IconProps) => (
  <Line {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Line>
);

export const IconSearch = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Line>
);

export const IconRefresh = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
    <path d="M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
    <path d="M20 20v-4h-4" />
  </Line>
);

export const IconMail = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Line>
);

export const IconLock = (p: IconProps) => (
  <Line {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 15v2" />
  </Line>
);

export const IconEye = (p: IconProps) => (
  <Line {...p}>
    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Line>
);

export const IconEyeOff = (p: IconProps) => (
  <Line {...p}>
    <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.7 3.6M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19a9.4 9.4 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </Line>
);

export const IconUser = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Line>
);

export const IconUsers = (p: IconProps) => (
  <Line {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Line>
);

export const IconInfo = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Line>
);

export const IconAlert = (p: IconProps) => (
  <Line {...p}>
    <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Line>
);

export const IconBuilding = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 21h18" />
    <path d="M12 3 4 8h16z" />
    <path d="M6 11v7M10 11v7M14 11v7M18 11v7" />
  </Line>
);

export const IconMegaphone = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1Z" />
    <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11" />
  </Line>
);

export const IconMapPin = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </Line>
);

export const IconPhone = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Line>
);

export const IconPlus = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 5v14M5 12h14" />
  </Line>
);

export const IconSparkle = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </Line>
);

export const IconBadge = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="m8.5 14 -1.5 7 5-2.5 5 2.5-1.5-7" />
  </Line>
);

export const IconNewspaper = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 5h13v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
    <path d="M17 9h3v9a2 2 0 0 1-2 2" />
    <path d="M7.5 9h6M7.5 12.5h6M7.5 16h4" />
  </Line>
);

export const IconScale = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3v18M7 21h10M5 7h14" />
    <path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" />
  </Line>
);

export const IconEdit = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Line>
);

export const IconTrash = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Line>
);

type SpotProps = { size?: number; className?: string };

function Spot({ size = 56, className, children }: SpotProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const P = "var(--ill-primary)";
const S = "var(--ill-secondary)";
const SOFT = "var(--ill-soft)";
const SKIN = "var(--ill-skin)";
const HAIR = "var(--ill-hair)";
const GOLD = "var(--ill-accent)";
const RED = "var(--ill-red)";
const W = "#ffffff";

export const SpotClearance = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <path d="M18 10h20l9 9v33a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z" fill={W} />
    <path d="M38 10v6a3 3 0 0 0 3 3h6" fill={S} />
    <rect x="20" y="22" width="16" height="3" rx="1.5" fill={P} />
    <rect x="20" y="29" width="22" height="2.5" rx="1.25" fill={S} />
    <rect x="20" y="35" width="18" height="2.5" rx="1.25" fill={S} />
    <circle cx="41" cy="45" r="8" fill={GOLD} />
    <circle cx="41" cy="45" r="5" fill="none" stroke={W} strokeWidth="1.6" />
    <path d="m38.6 45 1.7 1.7 3.2-3.4" stroke={W} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Spot>
);

export const SpotCertificate = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="9" y="15" width="46" height="32" rx="3" fill={W} />
    <rect x="12.5" y="18.5" width="39" height="25" rx="1.5" stroke={S} strokeWidth="1.4" />
    <rect x="18" y="24" width="20" height="3" rx="1.5" fill={P} />
    <rect x="18" y="30" width="15" height="2.5" rx="1.25" fill={S} />
    <path d="m40 40-3 13 5-3 5 3-3-13" fill={RED} />
    <circle cx="42" cy="36" r="7" fill={GOLD} />
    <path d="m42 32.5 1.1 2.3 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3Z" fill={W} />
  </Spot>
);

export const SpotResidency = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <path d="M10 30 30 14l20 16" fill={P} />
    <path d="M14 28h32v24H14z" fill={W} />
    <path d="M8 31 30 13l22 18" stroke={P} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="18" y="34" width="8" height="7" rx="1" fill={S} />
    <rect x="34" y="40" width="8" height="12" rx="1" fill={GOLD} />
    <circle cx="50" cy="38" r="4" fill={SKIN} />
    <path d="M46 36.5a4 4 0 0 1 8 0c-1.5-.8-5.5-1-8 0Z" fill={HAIR} />
    <path d="M43.5 54a6.5 6.5 0 0 1 13 0Z" fill={RED} />
  </Spot>
);

export const SpotIndigency = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <path
      d="M32 33c-6-4.4-10-7.9-10-12a5 5 0 0 1 10-1.3A5 5 0 0 1 42 21c0 4.1-4 7.6-10 12Z"
      fill={RED}
    />
    <path d="M8 40c4-1 8 0 11 2l6 3.5a3 3 0 0 1-2 5.5l-6-1" fill={SKIN} />
    <path d="M56 40c-4-1-8 0-11 2l-6 3.5a3 3 0 0 0 2 5.5l6-1" fill={SKIN} />
    <path d="M6 41h8v14H6zM50 41h8v14h-8z" fill={P} />
    <path d="M17 49.5 25 52h14l8-2.5" stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
  </Spot>
);

export const SpotBusiness = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="13" y="26" width="38" height="27" rx="2" fill={W} />
    <path d="M11 18h42l3 10H8z" fill={P} />
    <path d="M18.5 18 17 28M26 18l-1 10M33.5 18v10M41 18l1 10M48.5 18l1.5 10" stroke={W} strokeWidth="1.4" />
    <path d="M8 28a6 6 0 0 0 12 0 6 6 0 0 0 12 0 6 6 0 0 0 12 0 6 6 0 0 0 12 0" fill={S} />
    <rect x="17" y="37" width="12" height="16" rx="1" fill={GOLD} />
    <rect x="34" y="37" width="13" height="9" rx="1" fill={SOFT} />
    <circle cx="26" cy="45" r="1.1" fill={W} />
  </Spot>
);

export const SpotBarangayId = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="8" y="16" width="48" height="33" rx="4" fill={W} />
    <path d="M8 20a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v4H8z" fill={P} />
    <rect x="13" y="29" width="14" height="15" rx="2" fill={S} />
    <circle cx="20" cy="34.5" r="3" fill={SKIN} />
    <path d="M14.5 44a5.5 5.5 0 0 1 11 0Z" fill={P} />
    <rect x="31" y="31" width="19" height="3" rx="1.5" fill={P} />
    <rect x="31" y="37" width="14" height="2.5" rx="1.25" fill={S} />
    <rect x="31" y="42" width="10" height="2.5" rx="1.25" fill={GOLD} />
  </Spot>
);

export const SpotGoodMoral = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <path d="M32 8 13 15v14c0 12 8.2 21.6 19 25 10.8-3.4 19-13 19-25V15z" fill={P} />
    <path d="M32 13.5 18 18.7V29c0 9 6 16.4 14 19.3z" fill={S} />
    <path
      d="m32 20 3.3 6.7 7.4 1.1-5.3 5.2 1.2 7.3L32 36.8l-6.6 3.5 1.2-7.3-5.3-5.2 7.4-1.1Z"
      fill={GOLD}
    />
  </Spot>
);

export const SpotJobSeeker = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <circle cx="27" cy="18" r="7" fill={SKIN} />
    <path d="M20 16.5a7 7 0 0 1 14 0c-2.5-1.8-10-2-14 0Z" fill={HAIR} />
    <path d="M14 54c0-11 5.8-19 13-19s13 8 13 19z" fill={P} />
    <path d="m27 35-3 6 3 3 3-3z" fill={W} />
    <rect x="35" y="38" width="20" height="15" rx="2.5" fill={GOLD} />
    <path d="M41 38v-3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" stroke={HAIR} strokeWidth="2" />
    <rect x="35" y="43" width="20" height="2" fill={RED} opacity="0.55" />
  </Spot>
);

export const SpotOther = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="12" y="14" width="26" height="34" rx="3" fill={S} transform="rotate(-8 25 31)" />
    <rect x="20" y="12" width="28" height="38" rx="3" fill={W} />
    <rect x="25" y="19" width="15" height="3" rx="1.5" fill={P} />
    <rect x="25" y="26" width="18" height="2.5" rx="1.25" fill={S} />
    <rect x="25" y="31.5" width="12" height="2.5" rx="1.25" fill={S} />
    <circle cx="46" cy="46" r="9" fill={P} />
    <path d="M46 41.5v9M41.5 46h9" stroke={W} strokeWidth="2.4" strokeLinecap="round" />
  </Spot>
);

export const SpotAppointment = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="10" y="14" width="44" height="38" rx="5" fill={W} />
    <path d="M10 19a5 5 0 0 1 5-5h34a5 5 0 0 1 5 5v6H10z" fill={P} />
    <rect x="20" y="9" width="4" height="10" rx="2" fill={HAIR} />
    <rect x="40" y="9" width="4" height="10" rx="2" fill={HAIR} />
    <g fill={S}>
      <rect x="16" y="30" width="6" height="5" rx="1.2" />
      <rect x="25" y="30" width="6" height="5" rx="1.2" />
      <rect x="16" y="39" width="6" height="5" rx="1.2" />
    </g>
    <circle cx="42" cy="40" r="9" fill={GOLD} />
    <path d="m38 40 3 3 5-5.5" stroke={W} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </Spot>
);

export const SpotTrack = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="13" y="12" width="30" height="40" rx="3" fill={W} />
    <rect x="21" y="9" width="14" height="7" rx="2" fill={P} />
    <path d="m18 25 2 2 3.5-3.5" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="26" y="24" width="12" height="2.5" rx="1.25" fill={S} />
    <path d="m18 34 2 2 3.5-3.5" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="26" y="33" width="10" height="2.5" rx="1.25" fill={S} />
    <circle cx="43" cy="42" r="8" fill={W} stroke={GOLD} strokeWidth="3.5" />
    <path d="m49 48 6 6" stroke={HAIR} strokeWidth="4" strokeLinecap="round" />
  </Spot>
);

export const SpotNotification = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <path d="M20 29a12 12 0 1 1 24 0c0 10 5 13 5 13H15s5-3 5-13Z" fill={P} />
    <path d="M26 15.5A12 12 0 0 0 20 26" stroke={S} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M27 46a5 5 0 0 0 10 0Z" fill={GOLD} />
    <path d="M10 22a14 14 0 0 1 4-8M54 22a14 14 0 0 0-4-8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="44" cy="17" r="5" fill={RED} />
  </Spot>
);

export const SpotMission = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <circle cx="30" cy="36" r="18" fill={W} />
    <circle cx="30" cy="36" r="12.5" fill={S} />
    <circle cx="30" cy="36" r="7" fill={W} />
    <circle cx="30" cy="36" r="3" fill={RED} />
    <path d="M30 36 48 18" stroke={HAIR} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M48 18V8l8 5z" fill={GOLD} />
  </Spot>
);

export const SpotVision = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <g stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
      <path d="M32 6v6M14 12l3.5 4.5M50 12l-3.5 4.5M6 26l5.5 1.5M58 26l-5.5 1.5" />
    </g>
    <path d="M6 36s9.5-14 26-14 26 14 26 14-9.5 14-26 14S6 36 6 36Z" fill={W} />
    <circle cx="32" cy="36" r="10" fill={P} />
    <circle cx="32" cy="36" r="4.5" fill={HAIR} />
    <circle cx="35" cy="33" r="2" fill={W} />
  </Spot>
);

export const SpotBarangayHall = (p: SpotProps) => (
  <Spot {...p}>
    <path d="M6 56h52" stroke={HAIR} strokeWidth="2" strokeLinecap="round" />
    <path d="M10 28h44v28H10z" fill={W} />
    <path d="M6 29 32 15l26 14z" fill={P} />
    <rect x="27" y="7" width="10" height="10" fill={W} />
    <path d="M25 8.5 32 3l7 5.5z" fill={P} />
    <circle cx="32" cy="12" r="2" fill={GOLD} />
    <g fill={S}>
      <rect x="14" y="33" width="5" height="18" rx="1" />
      <rect x="22" y="33" width="5" height="18" rx="1" />
      <rect x="37" y="33" width="5" height="18" rx="1" />
      <rect x="45" y="33" width="5" height="18" rx="1" />
    </g>
    <rect x="29" y="40" width="6" height="16" rx="1" fill={GOLD} />
    <path d="M52 56V36" stroke={HAIR} strokeWidth="1.5" />
    <path d="M52 36h9v3h-9z" fill="#1d4ed8" />
    <path d="M52 39h9v3h-9z" fill={RED} />
    <path d="M52 36v6l4-3z" fill={W} />
  </Spot>
);

export const SpotResident = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <circle cx="28" cy="20" r="7.5" fill={SKIN} />
    <path d="M20.5 18.5a7.5 7.5 0 0 1 15 0c-3-2.3-11-2.6-15 0Z" fill={HAIR} />
    <path d="M13 58c0-13 6.7-22 15-22s15 9 15 22z" fill={P} />
    <rect x="38" y="30" width="13" height="22" rx="2.5" fill={HAIR} />
    <rect x="39.8" y="33" width="9.4" height="15" rx="1" fill={W} />
    <rect x="41.5" y="36" width="6" height="1.6" rx="0.8" fill={P} />
    <rect x="41.5" y="39.5" width="4.5" height="1.6" rx="0.8" fill={S} />
    <path d="M34 46c2 0 4-1 5-2" stroke={SKIN} strokeWidth="4" strokeLinecap="round" />
  </Spot>
);

export const SpotNews = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="30" y="12" width="24" height="30" rx="3" fill={W} />
    <rect x="34" y="17" width="14" height="3" rx="1.5" fill={P} />
    <rect x="34" y="23" width="16" height="2.5" rx="1.25" fill={S} />
    <rect x="34" y="28" width="12" height="2.5" rx="1.25" fill={S} />
    <path d="M10 30h6l14-9v26l-14-9h-6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" fill={P} />
    <path d="M14 38h6l2 12h-6z" fill={HAIR} />
    <circle cx="44" cy="44" r="7" fill={GOLD} />
    <path d="M44 40.5v4l2.5 1.5" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
  </Spot>
);

export const SpotBlotter = (p: SpotProps) => (
  <Spot {...p}>
    <circle cx="32" cy="32" r="30" fill={SOFT} />
    <rect x="14" y="16" width="24" height="32" rx="3" fill={W} />
    <rect x="18" y="21" width="12" height="3" rx="1.5" fill={P} />
    <rect x="18" y="27" width="16" height="2.5" rx="1.25" fill={S} />
    <rect x="18" y="32" width="14" height="2.5" rx="1.25" fill={S} />
    <rect x="18" y="37" width="10" height="2.5" rx="1.25" fill={S} />
    <path d="M46 20v28M40 48h12M37 26h18" stroke={HAIR} strokeWidth="2" strokeLinecap="round" />
    <path d="m37 26-4 9h8zM55 26l-4 9h8z" fill={GOLD} />
    <circle cx="46" cy="20" r="2.5" fill={RED} />
  </Spot>
);

export const DOCUMENT_SPOTS: Record<string, (p: SpotProps) => React.ReactElement> = {
  "Barangay Clearance": SpotClearance,
  "Barangay Certificate": SpotCertificate,
  "Certificate of Residency": SpotResidency,
  "Certificate of Indigency": SpotIndigency,
  "Barangay Business Clearance": SpotBusiness,
  "Barangay ID Application": SpotBarangayId,
  "Certificate of Good Moral Character": SpotGoodMoral,
  "Certificate of First-Time Job Seeker": SpotJobSeeker,
  "Other Document Request": SpotOther,
};

export function DocumentSpot({ type, ...p }: SpotProps & { type: string | null | undefined }) {
  const Cmp = (type && DOCUMENT_SPOTS[type]) || SpotOther;
  return <Cmp {...p} />;
}
