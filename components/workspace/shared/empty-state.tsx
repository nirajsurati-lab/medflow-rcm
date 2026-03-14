import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message: string;
  detail?: string;
  className?: string;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({
  message,
  detail,
  className,
  action,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-dashed border-border/80 bg-muted/45 px-6 py-8 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="space-y-3">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/85 text-sky-700 shadow-sm">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">{message}</p>
          {detail ? <p className="max-w-2xl leading-6">{detail}</p> : null}
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
