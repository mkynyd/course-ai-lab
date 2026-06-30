import {
  avatarPresetById,
  type AvatarPresetId,
} from "@/lib/user-profile";
import { cn } from "@/lib/utils";

const AVATAR_STYLE_CLASSES: Record<AvatarPresetId, string> = {
  lumen: "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]",
  study: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
  code: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
  research: "bg-[var(--color-info-muted)] text-[var(--color-info)]",
};

export function AvatarMark({
  presetId,
  className,
}: {
  presetId: AvatarPresetId | string | null | undefined;
  className?: string;
}) {
  const preset = avatarPresetById(presetId);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[var(--radius-md)] text-xs font-semibold",
        AVATAR_STYLE_CLASSES[preset.id],
        className
      )}
      aria-hidden="true"
    >
      {preset.label}
    </span>
  );
}
