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
    <Badge variant={getStatusVariant(status)} className={cn(className)}>
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
