import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  formatStatusLabel,
  getStatusVariant,
} from "@/components/workspace/workspace-utils";

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn(
        "h-auto rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em]",
        className
      )}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
