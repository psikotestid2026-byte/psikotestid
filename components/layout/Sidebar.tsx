import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
}

interface SidebarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  userWidget: ReactNode;
  items: SidebarItem[];
  activeTab: string;
  onTabChange?: (id: string) => void;
  onLogout?: () => void;
}

export function Sidebar({ title, subtitle, userWidget, items, activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0 h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        {title}
      </div>

      <div className="p-4">
        {userWidget}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {items.map(item => {
          const isActive = activeTab === item.id;
          const className = `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
            isActive 
              ? 'bg-brand-50 text-brand-600 font-semibold border-r-4 border-brand-600' 
              : 'text-slate-600 hover:bg-slate-50'
          }`;

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={className}>
                <span className="w-4 h-4 shrink-0">{item.icon}</span> {item.label}
              </Link>
            );
          }

          return (
            <button 
              key={item.id}
              onClick={() => onTabChange?.(item.id)} 
              className={className}
            >
              <span className="w-4 h-4 shrink-0">{item.icon}</span> {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </aside>
  );
}
