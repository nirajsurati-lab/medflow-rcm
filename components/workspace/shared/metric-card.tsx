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

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <AppCard>
      <AppCardHeader className="space-y-2">
        <AppCardTitle className="text-base">{metric.label}</AppCardTitle>
        <AppCardDescription>{metric.helper}</AppCardDescription>
      </AppCardHeader>
      <AppCardContent>
        <p className="text-3xl font-semibold text-slate-950">
          {formatMetricValue(metric)}
        </p>
      </AppCardContent>
    </AppCard>
  );
}
