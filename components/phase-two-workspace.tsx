import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { PhaseTwoWorkspaceProps } from "@/components/workspace/types";

export type { PhaseTwoWorkspaceProps } from "@/components/workspace/types";

export function PhaseTwoWorkspace(props: PhaseTwoWorkspaceProps) {
  return <WorkspaceShell {...props} />;
}
