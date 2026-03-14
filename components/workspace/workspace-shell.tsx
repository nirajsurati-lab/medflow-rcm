"use client";

import { WorkspaceContent } from "@/components/workspace/workspace-content";
import { WorkspaceActions } from "@/components/workspace/workspace-actions";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useWorkspaceController } from "@/components/workspace/workspace-hooks";
import type { PhaseTwoWorkspaceProps } from "@/components/workspace/types";

export function WorkspaceShell(props: PhaseTwoWorkspaceProps) {
  const controller = useWorkspaceController(props);

  return (
    <WorkspaceLayout
      activeTab={controller.meta.activeTab}
      visibleTabs={controller.meta.visibleTabs}
      onTabChange={controller.actions.setActiveTab}
      onRefresh={controller.actions.refreshWorkspace}
      isRefreshing={controller.meta.isRefreshing}
      organizationName={props.organizationName}
      userRole={props.userRole}
      userEmail={props.userEmail}
      header={
        <WorkspaceHeader
          kpis={props.data.dashboard.kpis}
          activeTab={controller.meta.activeTab}
          organizationName={props.organizationName}
          userRole={props.userRole}
          userEmail={props.userEmail}
        />
      }
      notices={<WorkspaceActions controller={controller} data={props.data} />}
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
