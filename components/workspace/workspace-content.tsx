"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppointmentsSection } from "@/components/workspace/sections/appointments-section";
import { AuthorizationsSection } from "@/components/workspace/sections/authorizations-section";
import { AuditSection } from "@/components/workspace/sections/audit-section";
import { ClaimsSection } from "@/components/workspace/sections/claims-section";
import { CollectionsSection } from "@/components/workspace/sections/collections-section";
import { DashboardSection } from "@/components/workspace/sections/dashboard-section";
import { DenialsSection } from "@/components/workspace/sections/denials-section";
import { PatientsSection } from "@/components/workspace/sections/patients-section";
import { PaymentsSection } from "@/components/workspace/sections/payments-section";
import { StatementsSection } from "@/components/workspace/sections/statements-section";
import type { WorkspaceController } from "@/components/workspace/types";
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
      className="space-y-6"
    >
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

      <TabsContent value="authorizations" className="space-y-4">
        <AuthorizationsSection controller={controller} data={data} />
      </TabsContent>

      <TabsContent value="statements" className="space-y-4">
        <StatementsSection controller={controller} data={data} />
      </TabsContent>

      <TabsContent value="collections" className="space-y-4">
        <CollectionsSection controller={controller} data={data} />
      </TabsContent>

      <TabsContent value="appointments" className="space-y-4">
        <AppointmentsSection controller={controller} data={data} />
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
