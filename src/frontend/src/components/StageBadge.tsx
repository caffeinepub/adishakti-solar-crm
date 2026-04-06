import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "../types";
import { STAGE_COLORS, STAGE_LABELS } from "../types";

interface StageBadgeProps {
  stage: PipelineStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const colors = STAGE_COLORS[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

export default StageBadge;
