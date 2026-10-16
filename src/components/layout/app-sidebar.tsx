"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons, IconType } from "@/components/icons";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "analytics",
  },
  {
    title: "Impostazioni",
    href: "/settings",
    icon: "settings",
  },
];

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[48px] bottom-0 z-30 bg-sidebar border-r border-border transition-all duration-200 flex flex-col justify-between py-3",
        collapsed ? "w-[48px]" : "w-[256px]"
      )}
    >
      <nav className="px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = Icons[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center h-[32px] px-2.5 rounded-sm text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="ml-3 truncate">{item.title}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2">
        <div
          className={cn(
            "p-2 rounded border border-border bg-card text-xs text-muted-foreground",
            collapsed && "text-center"
          )}
        >
          {collapsed ? (
            <Icons.shield className="w-4 h-4 mx-auto text-primary" />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-foreground font-medium">
                <span>OpenRouter Jev</span>
                <span className="text-[10px] text-success">Attivo</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Quota Target: ~2.00
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
