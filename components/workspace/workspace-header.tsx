import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

import { MetricCard } from "@/components/workspace/shared/metric-card";

type WorkspaceHeaderProps = {
  kpis: PhaseTwoWorkspaceData["dashboard"]["kpis"];
};

export function WorkspaceHeader({ kpis }: WorkspaceHeaderProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}
