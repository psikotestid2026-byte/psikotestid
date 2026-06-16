import { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  rightWidget?: ReactNode;
}

export function TopBar({ title, rightWidget }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="font-display font-bold text-xl text-slate-900 capitalize">{title}</h1>
      <div className="flex items-center gap-4">
        {rightWidget}
      </div>
    </header>
  );
}
