"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Icons } from "@/components/icons";

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AppHeader({ sidebarOpen, onToggleSidebar }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[48px] bg-sidebar border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Comprimi sidebar" : "Espandi sidebar"}
          className="p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
        >
          <Icons.menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Icons.layers className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-foreground">
            DoubleUp Jev
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground font-mono">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambia tema"
            className="p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
          >
            {theme === "dark" ? (
              <Icons.sun className="w-4 h-4 text-warning" />
            ) : (
              <Icons.moon className="w-4 h-4" />
            )}
          </button>
        )}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <Icons.user className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-foreground hidden sm:inline-block">
            Admin Jev
          </span>
        </div>
      </div>
    </header>
  );
}
