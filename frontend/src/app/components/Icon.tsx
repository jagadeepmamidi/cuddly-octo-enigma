import type { SVGProps } from "react";

export type IconName =
  | "location"
  | "phone"
  | "chat"
  | "mail"
  | "gift"
  | "scooter"
  | "bike"
  | "ev"
  | "idCard"
  | "checkCircle"
  | "shield"
  | "wrench"
  | "support"
  | "money"
  | "chart"
  | "settings"
  | "list"
  | "search"
  | "refresh"
  | "home"
  | "document"
  | "warning"
  | "close"
  | "spark"
  | "clock"
  | "calendar";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export default function Icon({ name, ...props }: IconProps) {
  const baseProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8
  };

  switch (name) {
    case "location":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M5 4h4l2 5-2.5 1.8a15 15 0 0 0 4.2 4.2L14.5 13l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.7 2 2 0 0 1 5 4Z" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M4 5h16v11H8l-4 4V5Z" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "gift":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <rect x="3.5" y="10" width="17" height="10.5" rx="2" />
          <path d="M12 10v10.5M3.5 14h17M7 10c-1.7 0-3-1.2-3-2.8C4 5.7 5.3 4.5 7 4.5c2.4 0 5 3 5 5.5M17 10c1.7 0 3-1.2 3-2.8 0-1.5-1.3-2.7-3-2.7-2.4 0-5 3-5 5.5" />
        </svg>
      );
    case "scooter":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="18" r="2.5" />
          <path d="M9 18h6l2-6h-4l-1.2-5H8.7M9 10h4" />
        </svg>
      );
    case "bike":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="6.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="m6.5 17.5 4.5-6h3l3.5 6M11 11.5l1.5-3h3" />
        </svg>
      );
    case "ev":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="m13 3-6 9h4l-1 9 7-10h-4l0-8Z" />
        </svg>
      );
    case "idCard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <circle cx="8" cy="12" r="1.8" />
          <path d="M12 10.5h6M12 13h6" />
        </svg>
      );
    case "checkCircle":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.2 2.2 4.8-5" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M12 3.5 5.5 6v5.5c0 4.3 2.8 7.3 6.5 9 3.7-1.7 6.5-4.7 6.5-9V6L12 3.5Z" />
        </svg>
      );
    case "wrench":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="m14 7 3-3a3 3 0 1 1 3 3l-3 3M4 20l7.5-7.5M3.5 19.5l2 2 2-2-2-2-2 2Z" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M4 12a8 8 0 1 1 16 0" />
          <rect x="3.5" y="12" width="3.5" height="5.5" rx="1.2" />
          <rect x="17" y="12" width="3.5" height="5.5" rx="1.2" />
          <path d="M12 20h4" />
        </svg>
      );
    case "money":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9h0M17 15h0" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M4 20V4M4 20h16M8 17v-5M12 17V8M16 17v-7" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="m19 12 1.8-1-1-2-2 .3a7.2 7.2 0 0 0-1.5-1.5L16.5 6l-2-1L13.5 7a7 7 0 0 0-3 0L9.5 5l-2 1 .2 1.8a7.2 7.2 0 0 0-1.5 1.5l-2-.3-1 2L5 12l-1.8 1 1 2 2-.3a7.2 7.2 0 0 0 1.5 1.5L7.5 18l2 1 1-2a7 7 0 0 0 3 0l1 2 2-1-.2-1.8a7.2 7.2 0 0 0 1.5-1.5l2 .3 1-2L19 12Z" />
        </svg>
      );
    case "list":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M8 7h12M8 12h12M8 17h12M4.5 7h0M4.5 12h0M4.5 17h0" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M20 6v5h-5M4 18v-5h5M6.5 9A7 7 0 0 1 18 7M17.5 15A7 7 0 0 1 6 17" />
        </svg>
      );
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="m4 11 8-6 8 6v8.5H4V11Z" />
          <path d="M9.5 19.5v-5h5v5" />
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M7 3.5h7l4 4v13H7z" />
          <path d="M14 3.5V8h4M9.5 12h6M9.5 15h6" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="m12 4 8 14H4L12 4Z" />
          <path d="M12 9v4M12 16h0" />
        </svg>
      );
    case "close":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <path d="m12 3 1.7 4.8L19 9.5l-5.3 1.7L12 16l-1.7-4.8L5 9.5l5.3-1.7L12 3Z" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...baseProps} {...props}>
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
          <path d="M3.5 9.5h17M8 3.5v4M16 3.5v4" />
        </svg>
      );
    default:
      return null;
  }
}
