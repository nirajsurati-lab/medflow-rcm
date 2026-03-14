"use client";

import { CircleAlert, DatabaseZap } from "lucide-react";

import { NoticeStack } from "@/components/system/notice-stack";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type WorkspaceActionsProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function WorkspaceActions({
  controller,
  data,
}: WorkspaceActionsProps) {
  const { feedback } = controller.meta;

  const hasClaimSetupGap = data.providers.length === 0 || data.payers.length === 0;

  if (!feedback && !hasClaimSetupGap) {
    return null;
  }

  return (
    <NoticeStack>
      {feedback ? (
        <Alert variant={feedback.tone === "error" ? "destructive" : "default"}>
          <CircleAlert className="size-4" />
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
          <AlertAction>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={controller.actions.clearFeedback}
              aria-label="Dismiss feedback"
            >
              <span className="text-sm">x</span>
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {hasClaimSetupGap ? (
        <Alert>
          <DatabaseZap className="size-4" />
          <AlertTitle>Claim setup still needs master data</AlertTitle>
          <AlertDescription>
            Add at least one provider and one payer in the Claims tab before
            submitting your first claim.
          </AlertDescription>
        </Alert>
      ) : null}
    </NoticeStack>
  );
}
