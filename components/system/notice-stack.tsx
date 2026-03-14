import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NoticeStackProps = {
  children: ReactNode;
  className?: string;
};

export function NoticeStack({ children, className }: NoticeStackProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
