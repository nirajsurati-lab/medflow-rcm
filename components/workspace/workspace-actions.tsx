"use client";

import { RefreshCw } from "lucide-react";

import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";
import { WORKSPACE_TAB_LABELS, type WorkspaceController } from "@/components/workspace/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorkspaceActionsProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function WorkspaceActions({
  controller,
  data,
}: WorkspaceActionsProps) {
  const { feedback, isRefreshing, pendingAction, visibleTabs } = controller.meta;

  return (
    <div className="space-y-4">
      {feedback ? (
        <Alert variant={feedback.tone === "error" ? "destructive" : "default"}>
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      {data.providers.length === 0 || data.payers.length === 0 ? (
        <Alert>
          <AlertTitle>Claim setup still needs master data</AlertTitle>
          <AlertDescription>
            Add at least one provider and one payer in the Claims tab before
            submitting your first claim.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <TabsList
          variant="line"
          className="max-w-full gap-1 overflow-x-auto whitespace-nowrap pb-1"
        >
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {WORKSPACE_TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="outline"
          type="button"
          onClick={controller.actions.refreshWorkspace}
          disabled={isRefreshing || pendingAction !== null}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
