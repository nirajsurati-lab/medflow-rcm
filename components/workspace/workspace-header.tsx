import { Building2, ShieldCheck, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/system/page-header";
import { Badge } from "@/components/ui/badge";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

import { MetricCard } from "@/components/workspace/shared/metric-card";
import {
  WORKSPACE_TAB_META,
  type WorkspaceTab,
} from "@/components/workspace/types";

type WorkspaceHeaderProps = {
  kpis: PhaseTwoWorkspaceData["dashboard"]["kpis"];
  activeTab: WorkspaceTab;
  organizationName: string;
  userRole: string;
  userEmail: string;
};

export function WorkspaceHeader({
  kpis,
  activeTab,
  organizationName,
  userRole,
  userEmail,
}: WorkspaceHeaderProps) {
  const activeMeta = WORKSPACE_TAB_META[activeTab];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Revenue Operations Cockpit"
        title={`${activeMeta.label} workspace`}
        description={activeMeta.description}
        stats={[
          {
            label: "Organization",
            value: organizationName,
          },
          {
            label: "User",
            value: userEmail,
          },
          {
            label: "Role",
            value: userRole,
          },
          {
            label: "View",
            value: activeMeta.label,
          },
        ]}
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-auto rounded-full border-border/80 bg-white/80 px-3 py-1.5 text-foreground"
            >
              <Building2 className="mr-1 size-3.5" />
              Org-scoped workflows
            </Badge>
            <Badge
              variant="outline"
              className="h-auto rounded-full border-border/80 bg-white/80 px-3 py-1.5 text-foreground"
            >
              <ShieldCheck className="mr-1 size-3.5" />
              Supabase access controls
            </Badge>
            <Badge
              variant="outline"
              className="h-auto rounded-full border-border/80 bg-white/80 px-3 py-1.5 text-foreground"
            >
              <Sparkles className="mr-1 size-3.5" />
              Manual RCM workflows
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}
