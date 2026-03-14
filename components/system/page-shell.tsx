import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: "default" | "workspace" | "auth" | "checkout";
};

const toneStyles = {
  default:
    "before:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%)] after:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%)]",
  workspace:
    "before:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_36%)] after:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%)]",
  auth:
    "before:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_35%)] after:bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_32%)]",
  checkout:
    "before:bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.2),transparent_35%)] after:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_32%)]",
} as const;

export function PageShell({
  children,
  className,
  containerClassName,
  tone = "default",
}: PageShellProps) {
  return (
    <main
      className={cn(
        "relative isolate min-h-screen overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6",
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
        toneStyles[tone],
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(15,23,42,0.045),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/40 blur-3xl"
      />
      <div className={cn("relative mx-auto w-full max-w-7xl", containerClassName)}>
        {children}
      </div>
    </main>
  );
}
