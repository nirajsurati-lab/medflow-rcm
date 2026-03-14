import type { ReactNode } from "react";

import {
  AppCard,
  AppCardAction,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderStat = {
  label: string;
  value: string;
};

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  stats?: PageHeaderStat[];
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  stats = [],
  className,
}: PageHeaderProps) {
  return (
    <AppCard className={cn("bg-white/85 shadow-lg", className)}>
      <AppCardHeader className="gap-4 md:flex md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <AppCardTitle className="text-3xl text-slate-950">
              {title}
            </AppCardTitle>
            <AppCardDescription className="max-w-3xl leading-6">
              {description}
            </AppCardDescription>
          </div>
          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.map((stat) => (
                <Badge
                  key={`${stat.label}-${stat.value}`}
                  variant="outline"
                  className="h-auto rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
                >
                  <span className="font-semibold text-slate-950">
                    {stat.label}:
                  </span>{" "}
                  {stat.value}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {action ? <AppCardAction>{action}</AppCardAction> : null}
      </AppCardHeader>
    </AppCard>
  );
}
