import type { ReactNode } from "react";

type WorkspaceLayoutProps = {
  header: ReactNode;
  content: ReactNode;
};

export function WorkspaceLayout({
  header,
  content,
}: WorkspaceLayoutProps) {
  return (
    <div className="space-y-6">
      {header}
      {content}
    </div>
  );
}
