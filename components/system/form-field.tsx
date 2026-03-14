import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          {label}
        </Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
