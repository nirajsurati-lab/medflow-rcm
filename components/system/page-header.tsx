import type { ReactNode } from "react";

import {
  AppCard,
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
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  stats = [],
  meta,
  className,
}: PageHeaderProps) {
  return (
    <AppCard
      className={cn(
        "relative overflow-hidden border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(231,245,255,0.72)_45%,rgba(230,255,247,0.62)_100%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_45%)]" />
      <AppCardHeader className="relative gap-6 px-6 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-4">
            {eyebrow ? (
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-sky-700">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-3">
              <AppCardTitle className="max-w-4xl font-heading text-3xl text-foreground sm:text-4xl">
                {title}
              </AppCardTitle>
              <AppCardDescription className="max-w-3xl text-base leading-7">
                {description}
              </AppCardDescription>
            </div>
            {meta ? <div>{meta}</div> : null}
          </div>
          {action ? <div className="relative z-10 justify-self-start lg:justify-self-end">{action}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className="rounded-[22px] border border-white/80 bg-white/70 px-4 py-4 shadow-sm backdrop-blur"
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {stats.length === 0 && eyebrow ? (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-auto rounded-full border-border/70 bg-white/75 px-3 py-1.5 text-foreground"
            >
              {eyebrow}
            </Badge>
          </div>
        ) : null}
      </AppCardHeader>
    </AppCard>
  );
}
