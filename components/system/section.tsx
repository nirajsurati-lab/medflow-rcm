import type { ReactNode } from "react";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { cn } from "@/lib/utils";

type SectionProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footer?: ReactNode;
};

export function Section({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
  footer,
}: SectionProps) {
  return (
    <AppCard className={cn("overflow-hidden border-border/60 bg-white/76", className)}>
      <AppCardHeader
        className={cn(
          "gap-4 border-b border-border/60 px-6 py-5",
          actions ? "md:flex md:flex-row md:items-end md:justify-between" : undefined,
          headerClassName
        )}
      >
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sky-700">
              {eyebrow}
            </p>
          ) : null}
          <AppCardTitle className="text-xl">{title}</AppCardTitle>
          {description ? (
            <AppCardDescription>{description}</AppCardDescription>
          ) : null}
        </div>
        {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
      </AppCardHeader>
      <AppCardContent className={cn("px-6 py-6", contentClassName)}>
        {children}
      </AppCardContent>
      {footer ? <AppCardFooter>{footer}</AppCardFooter> : null}
    </AppCard>
  );
}
