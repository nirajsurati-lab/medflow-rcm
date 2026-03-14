"use client";

import { useState, type ReactNode } from "react";
import { HeartPulse, Menu, RefreshCw, ShieldCheck } from "lucide-react";

import { AppCard } from "@/components/system/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  WORKSPACE_TAB_META,
  type WorkspaceTab,
} from "@/components/workspace/types";
import { cn } from "@/lib/utils";

type WorkspaceLayoutProps = {
  activeTab: WorkspaceTab;
  visibleTabs: readonly WorkspaceTab[];
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  organizationName: string;
  userRole: string;
  userEmail: string;
  header: ReactNode;
  notices?: ReactNode;
  content: ReactNode;
};

type NavigationTone = "sidebar" | "surface";

type WorkspaceNavListProps = {
  activeTab: WorkspaceTab;
  visibleTabs: readonly WorkspaceTab[];
  onSelect: (tab: WorkspaceTab) => void;
  tone: NavigationTone;
  onAfterSelect?: () => void;
};

function WorkspaceNavList({
  activeTab,
  visibleTabs,
  onSelect,
  tone,
  onAfterSelect,
}: WorkspaceNavListProps) {
  return (
    <div className="space-y-1.5">
      {visibleTabs.map((tab) => {
        const meta = WORKSPACE_TAB_META[tab];
        const Icon = meta.icon;
        const isActive = tab === activeTab;
        const showDescription = tone === "surface";

        return (
          <Button
            key={tab}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start rounded-2xl px-3 py-3 text-left whitespace-normal",
              tone === "sidebar"
                ? isActive
                  ? "bg-white/12 text-white ring-1 ring-white/12 shadow-[0_16px_40px_-26px_rgba(15,23,42,0.8)] hover:bg-white/14"
                  : "text-sidebar-foreground/78 hover:bg-white/7 hover:text-white"
                : isActive
                  ? "bg-secondary text-foreground shadow-sm hover:bg-secondary"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
            )}
            onClick={() => {
              onSelect(tab);
              onAfterSelect?.();
            }}
          >
            <div
              className={cn(
                "flex w-full min-w-0 gap-3",
                tone === "sidebar" ? "items-center" : "items-start"
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-2xl",
                  tone === "sidebar"
                    ? isActive
                      ? "size-10 bg-white/14 text-white"
                      : "size-10 bg-white/8 text-sidebar-foreground/88"
                    : isActive
                      ? "size-10 bg-white text-sky-700 shadow-sm"
                      : "size-10 bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "min-w-0 truncate font-medium",
                      tone === "sidebar" ? "text-sm" : "text-sm"
                    )}
                  >
                    {meta.label}
                  </p>
                  {tone === "sidebar" && isActive ? (
                    <span className="size-2 shrink-0 rounded-full bg-cyan-300" />
                  ) : null}
                </div>
                {showDescription ? (
                  <p
                    className={cn(
                      "mt-1 text-xs leading-5 text-muted-foreground"
                    )}
                  >
                    {meta.description}
                  </p>
                ) : null}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}

function SidebarActions({
  isRefreshing,
  onRefresh,
  tone,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
  tone: NavigationTone;
}) {
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={tone === "sidebar" ? "secondary" : "outline"}
        className={cn(
          "w-full justify-start",
          tone === "sidebar"
            ? "bg-white/14 text-white hover:bg-white/18"
            : "bg-background/80"
        )}
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("size-4", isRefreshing ? "animate-spin" : undefined)} />
        Refresh workspace
      </Button>
      <form action="/api/auth/logout" method="post" className="w-full">
        <Button
          type="submit"
          variant={tone === "sidebar" ? "outline" : "ghost"}
          className={cn(
            "w-full justify-start",
            tone === "sidebar"
              ? "border-white/14 bg-transparent text-white hover:bg-white/10"
              : "hover:bg-muted"
          )}
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}

function SidebarProfile({
  organizationName,
  userRole,
  userEmail,
  tone,
}: {
  organizationName: string;
  userRole: string;
  userEmail: string;
  tone: NavigationTone;
}) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em]",
          tone === "sidebar"
            ? "border border-white/12 bg-white/8 text-white/88"
            : "border border-border/80 bg-white/80 text-foreground"
        )}
      >
        <HeartPulse className="size-4" />
        MedFlow Pro
      </div>
      <div className="space-y-2">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.24em]",
            tone === "sidebar" ? "text-white/58" : "text-muted-foreground"
          )}
        >
          Revenue workspace
        </p>
        <h2
          className={cn(
            "font-heading text-2xl font-semibold tracking-[-0.03em]",
            tone === "sidebar" ? "text-white" : "text-foreground"
          )}
        >
          {organizationName}
        </h2>
        <p
          className={cn(
            "text-sm leading-6",
            tone === "sidebar" ? "text-white/72" : "text-muted-foreground"
          )}
          title={userEmail}
        >
          <span className={cn(tone === "sidebar" ? "line-clamp-2" : "break-all")}>
            {userEmail}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={cn(
            "h-auto rounded-full px-3 py-1.5",
            tone === "sidebar"
              ? "border-white/14 bg-white/8 text-white"
              : "border-border/80 bg-white/70 text-foreground"
          )}
        >
          <ShieldCheck className="mr-1 size-3.5" />
          {userRole}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "h-auto rounded-full px-3 py-1.5",
            tone === "sidebar"
              ? "border-white/14 bg-white/8 text-white/88"
              : "border-border/80 bg-white/70 text-muted-foreground"
          )}
        >
          Phase 4
        </Badge>
      </div>
    </div>
  );
}

export function WorkspaceLayout({
  activeTab,
  visibleTabs,
  onTabChange,
  onRefresh,
  isRefreshing,
  organizationName,
  userRole,
  userEmail,
  header,
  notices,
  content,
}: WorkspaceLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeMeta = WORKSPACE_TAB_META[activeTab];

  return (
    <div className="relative lg:pl-[22rem] xl:pl-[23.5rem]">
      <aside className="hidden lg:block">
        <div className="fixed inset-y-4 left-3 z-20 flex w-[20rem] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,33,0.98),rgba(15,33,66,0.96)_45%,rgba(17,47,88,0.94))] text-sidebar-foreground shadow-[0_42px_120px_-56px_rgba(2,12,27,0.95)] ring-1 ring-slate-950/10 sm:left-4 xl:left-5 xl:w-[21.5rem]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_30%)]"
          />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="space-y-6 border-b border-white/10 px-6 py-6">
              <SidebarProfile
                organizationName={organizationName}
                userRole={userRole}
                userEmail={userEmail}
                tone="sidebar"
              />
            </div>
            <ScrollArea className="min-h-0 flex-1 px-4 py-5">
              <div className="space-y-4">
                <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  Navigation
                </p>
                <WorkspaceNavList
                  activeTab={activeTab}
                  visibleTabs={visibleTabs}
                  tone="sidebar"
                  onSelect={(tab) => onTabChange(tab)}
                />
              </div>
            </ScrollArea>
            <div className="border-t border-white/10 px-6 py-5">
              <SidebarActions
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                tone="sidebar"
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <div className="lg:hidden">
          <AppCard className="border-border/70 bg-white/80">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Revenue workspace
                </p>
                <p className="truncate font-heading text-xl font-semibold text-foreground">
                  {activeMeta.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("size-4", isRefreshing ? "animate-spin" : undefined)}
                  />
                  <span className="sr-only">Refresh workspace</span>
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </div>
            </div>
          </AppCard>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-[92vw] border-r border-border/70 bg-[linear-gradient(180deg,rgba(250,252,255,0.98),rgba(237,245,255,0.96))] sm:max-w-md"
          >
            <SheetHeader className="pb-0">
              <SheetTitle className="font-heading text-2xl">Workspace nav</SheetTitle>
              <SheetDescription>
                Jump between billing workflows and keep the team context close at hand.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-4">
              <SidebarProfile
                organizationName={organizationName}
                userRole={userRole}
                userEmail={userEmail}
                tone="surface"
              />
              <WorkspaceNavList
                activeTab={activeTab}
                visibleTabs={visibleTabs}
                tone="surface"
                onSelect={(tab) => onTabChange(tab)}
                onAfterSelect={() => setMobileNavOpen(false)}
              />
              <SidebarActions
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                tone="surface"
              />
            </div>
          </SheetContent>
        </Sheet>

        {header}
        {notices}
        <div className="min-w-0">{content}</div>
      </div>
    </div>
  );
}
