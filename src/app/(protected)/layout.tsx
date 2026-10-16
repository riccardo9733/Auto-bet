"use client";

import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        sidebarOpen={!sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex pt-[48px] flex-1">
        <AppSidebar collapsed={sidebarCollapsed} />
        <main
          className={cn(
            "flex-1 transition-all duration-200 min-h-[calc(100vh-48px)] bg-background rounded-tl-[12px] border-l border-t border-border mt-0",
            sidebarCollapsed ? "ml-[48px]" : "ml-[256px]"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
