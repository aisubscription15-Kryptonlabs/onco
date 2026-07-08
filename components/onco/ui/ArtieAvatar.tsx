import { cn } from "@/lib/utils";
import { RobotAgentIcon } from "./icons";

type ArtieAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-3xl",
  md: "h-10 w-10 text-4xl",
  lg: "h-14 w-14 text-5xl",
};

export function ArtieAvatar({ size = "md", className }: ArtieAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white text-onco-ink shadow-onco ring-1 ring-onco-line",
        sizes[size],
        className,
      )}
    >
      <RobotAgentIcon />
    </div>
  );
}
