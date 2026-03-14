import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message: string;
  detail?: string;
  className?: string;
  action?: ReactNode;
};

export function EmptyState({
  message,
  detail,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-sm text-slate-500",
        className
      )}
    >
      <div className="space-y-2">
        <p className="font-medium text-slate-700">{message}</p>
        {detail ? <p>{detail}</p> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
