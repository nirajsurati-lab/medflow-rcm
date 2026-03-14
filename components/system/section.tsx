import type { ReactNode } from "react";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { cn } from "@/lib/utils";

type SectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
};

export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
}: SectionProps) {
  return (
    <AppCard className={className}>
      <AppCardHeader
        className={cn(
          actions ? "gap-3 md:flex md:flex-row md:items-end md:justify-between" : undefined,
          headerClassName
        )}
      >
        <div className="space-y-1">
          <AppCardTitle>{title}</AppCardTitle>
          {description ? (
            <AppCardDescription>{description}</AppCardDescription>
          ) : null}
        </div>
        {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
      </AppCardHeader>
      <AppCardContent className={contentClassName}>{children}</AppCardContent>
    </AppCard>
  );
}
