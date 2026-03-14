"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AuditSection } from "@/components/workspace/sections/audit-section";
import { ClaimsSection } from "@/components/workspace/sections/claims-section";
import { DashboardSection } from "@/components/workspace/sections/dashboard-section";
import { DenialsSection } from "@/components/workspace/sections/denials-section";
import { PatientsSection } from "@/components/workspace/sections/patients-section";
import { PaymentsSection } from "@/components/workspace/sections/payments-section";
import type { WorkspaceController } from "@/components/workspace/types";
import { WorkspaceActions } from "@/components/workspace/workspace-actions";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type WorkspaceContentProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
  organizationName: string;
  userRole: string;
};

export function WorkspaceContent({
  controller,
  data,
  organizationName,
  userRole,
}: WorkspaceContentProps) {
  return (
    <Tabs
      value={controller.meta.activeTab}
      onValueChange={controller.actions.setActiveTab}
      className="space-y-4"
    >
      <WorkspaceActions controller={controller} data={data} />

      <TabsContent value="dashboard" className="space-y-4">
        <DashboardSection
          controller={controller}
          data={data}
          organizationName={organizationName}
          userRole={userRole}
        />
      </TabsContent>

      <TabsContent value="patients" className="space-y-4">
        <PatientsSection controller={controller} />
      </TabsContent>

      <TabsContent value="claims" className="space-y-4">
        <ClaimsSection controller={controller} data={data} />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <PaymentsSection controller={controller} data={data} />
      </TabsContent>

      <TabsContent value="denials" className="space-y-4">
        <DenialsSection controller={controller} data={data} />
      </TabsContent>

      {userRole === "admin" ? (
        <TabsContent value="audit" className="space-y-4">
          <AuditSection controller={controller} data={data} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
