import type { ReactNode } from "react";

type SectionToolbarProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionToolbar({
  title,
  description,
  actions,
}: SectionToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-muted/35 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="font-heading text-lg font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
