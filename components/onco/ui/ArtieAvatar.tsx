import { cn } from "@/lib/utils";

type ArtieAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function ArtieAvatar({ size = "md", className }: ArtieAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-onco ring-1 ring-onco-line",
        sizes[size],
        className,
      )}
    >
      <img alt="" aria-hidden="true" className="h-full w-full object-contain object-center" src="/onco/icons/artie-agent-cutout.png" />
      <span className="artie-blink-lid" style={{ left: "35%" }} aria-hidden="true" />
      <span className="artie-blink-lid" style={{ left: "55%" }} aria-hidden="true" />
    </div>
  );
}
