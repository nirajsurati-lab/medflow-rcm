"use client";

import { WorkspaceContent } from "@/components/workspace/workspace-content";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useWorkspaceController } from "@/components/workspace/workspace-hooks";
import type { PhaseTwoWorkspaceProps } from "@/components/workspace/types";

export function WorkspaceShell(props: PhaseTwoWorkspaceProps) {
  const controller = useWorkspaceController(props);

  return (
    <WorkspaceLayout
      header={<WorkspaceHeader kpis={props.data.dashboard.kpis} />}
      content={
        <WorkspaceContent
          controller={controller}
          data={props.data}
          organizationName={props.organizationName}
          userRole={props.userRole}
        />
      }
    />
  );
}
