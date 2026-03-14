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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="font-medium text-slate-950">{title}</p>
        {description ? (
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
