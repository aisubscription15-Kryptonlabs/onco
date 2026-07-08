import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

export function WalkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 4.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
      <path d="m10.5 8.2 2.3-1.1 2.4 2.1" />
      <path d="m12.6 7.3-1.4 5.2 3.4 3.2" />
      <path d="m9.5 12.4-2.2 3.9" />
      <path d="m14.6 15.7 2 5" />
      <path d="m10.9 12.5 3.7.8" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </IconBase>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <path d="M5 5h14v16H5z" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 3 5-7" />
    </IconBase>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22c4.4 0 7-2.8 7-6.7 0-3.2-2-5.3-4.1-7.5-.8-.8-1.7-1.8-2.4-2.8-.4 2.8-1.8 4.2-3.1 5.5C8.1 11.8 7 13.1 7 15.4 7 19.1 9.4 22 12 22Z" />
      <path d="M12 18c1.6 0 2.5-1 2.5-2.4 0-1.1-.7-1.9-1.5-2.8-.3.9-.8 1.5-1.3 2-.5.5-.9 1-.9 1.8 0 .8.5 1.4 1.2 1.4Z" />
    </IconBase>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
    </IconBase>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="m9 13-2 8 5-3 5 3-2-8" />
      <path d="m10.5 8 1 1 2-2" />
    </IconBase>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.5 8.6c0 5.3-8.5 10.4-8.5 10.4S3.5 13.9 3.5 8.6A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.5 2.1Z" />
    </IconBase>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 6.5A7.5 7.5 0 0 1 12.5 3h1A7.5 7.5 0 0 1 21 10.5v.5a7 7 0 0 1-7 7H9l-5 3 1.4-5A7.2 7.2 0 0 1 3 11v-.5" />
    </IconBase>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="11" rx="4" width="7" x="8.5" y="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </IconBase>
  );
}

export function AiAgentIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m18.4 5.6-2.1 2.1" />
      <path d="m7.7 16.3-2.1 2.1" />
      <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
    </IconBase>
  );
}

export function RobotAgentIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 64 64"
      width="1em"
      {...props}
    >
      <path d="M32 8v8" stroke="currentColor" strokeLinecap="round" strokeWidth="3.2" />
      <circle cx="32" cy="7.5" fill="#F7F4ED" r="4.5" stroke="currentColor" strokeWidth="3" />
      <path d="M17 25h-4.5A4.5 4.5 0 0 0 8 29.5v9A4.5 4.5 0 0 0 12.5 43H17" fill="#46BDEB" stroke="currentColor" strokeWidth="3" />
      <path d="M47 25h4.5a4.5 4.5 0 0 1 4.5 4.5v9a4.5 4.5 0 0 1-4.5 4.5H47" fill="#46BDEB" stroke="currentColor" strokeWidth="3" />
      <rect fill="#F7F4ED" height="34" rx="10" stroke="currentColor" strokeWidth="3.2" width="34" x="15" y="17" />
      <rect fill="#46BDEB" height="17" rx="5" stroke="currentColor" strokeWidth="3" width="24" x="20" y="26" />
      <circle cx="27" cy="34" fill="currentColor" r="2.4" />
      <circle cx="37" cy="34" fill="currentColor" r="2.4" />
      <path d="M29.5 39c1.5 1.4 3.5 1.4 5 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M24 51v5" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M32 51v5" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M40 51v5" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <circle cx="24" cy="58" fill="#F7F4ED" r="2.5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="32" cy="58" fill="#F7F4ED" r="2.5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="40" cy="58" fill="#F7F4ED" r="2.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="m51 11 2.2 4.2 4.3 2.1-4.3 2.2L51 24l-2.2-4.5-4.3-2.2 4.3-2.1L51 11Z" fill="#FFD15C" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4 4L19 6" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconBase>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </IconBase>
  );
}
