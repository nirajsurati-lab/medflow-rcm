import {
  BadgeDollarSign,
  ChartColumnBig,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { formatMetricValue } from "@/components/workspace/workspace-utils";

type MetricCardProps = {
  metric: PhaseTwoWorkspaceData["dashboard"]["kpis"][number];
};

const metricVisuals = {
  "Outstanding A/R": {
    icon: BadgeDollarSign,
    chip: "Cash visibility",
    accent:
      "from-sky-500/16 via-white to-cyan-400/12 text-sky-700",
  },
  "Submitted Claims": {
    icon: ChartColumnBig,
    chip: "Payer queue",
    accent:
      "from-indigo-500/16 via-white to-sky-400/12 text-indigo-700",
  },
  "Denial Rate": {
    icon: ShieldAlert,
    chip: "Risk watch",
    accent:
      "from-amber-500/16 via-white to-rose-400/12 text-amber-700",
  },
  "Patient Payments": {
    icon: WalletCards,
    chip: "Collections",
    accent:
      "from-emerald-500/16 via-white to-cyan-400/12 text-emerald-700",
  },
} as const;

export function MetricCard({ metric }: MetricCardProps) {
  const visual =
    metricVisuals[metric.label as keyof typeof metricVisuals] ??
    metricVisuals["Submitted Claims"];
  const Icon = visual.icon;

  return (
    <AppCard
      className={`relative overflow-hidden border-border/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(245,250,255,0.74))]`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${visual.accent}`}
      />
      <AppCardHeader className="relative space-y-3 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {visual.chip}
          </span>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
            <Icon className="size-5 text-current" />
          </div>
        </div>
        <div className="space-y-1.5">
          <AppCardTitle className="text-lg">{metric.label}</AppCardTitle>
          <AppCardDescription>{metric.helper}</AppCardDescription>
        </div>
      </AppCardHeader>
      <AppCardContent className="relative px-5 pb-5">
        <p className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground">
          {formatMetricValue(metric)}
        </p>
      </AppCardContent>
    </AppCard>
  );
}
