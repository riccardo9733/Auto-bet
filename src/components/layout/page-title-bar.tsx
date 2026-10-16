"use client";

import * as React from "react";

interface PageTitleBarProps {
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageTitleBar({ title, actions, children }: PageTitleBarProps) {
  return (
    <div className="sticky top-[48px] z-20 min-h-[64px] bg-background border-b border-border px-6 py-3 flex flex-col justify-center">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-normal text-foreground truncate">{title}</h1>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
