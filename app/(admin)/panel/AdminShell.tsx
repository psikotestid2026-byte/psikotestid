'use client';

import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Building2, FileSpreadsheet, Scroll, UserCog } from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/panel/login') {
    return <>{children}</>;
  }

  const menuItems: SidebarItem[] = [
    { id: 'overview', label: 'Ringkasan Sistem', icon: <LayoutDashboard />, href: '/panel' },
    { id: 'customers', label: 'Perusahaan / Klien', icon: <Building2 />, href: '/panel/customers' },
    { id: 'tests', label: 'Master Alat Tes', icon: <FileSpreadsheet />, href: '/panel/tests' },
    { id: 'norms', label: 'Norma & Skoring', icon: <Scroll />, href: '/panel/norms' },
    { id: 'admins', label: 'Manajemen Admin', icon: <UserCog />, href: '/panel/admins' }
  ];

  // Determine active tab from pathname
  let activeTab = 'overview';
  if (pathname.includes('/panel/customers')) activeTab = 'customers';
  else if (pathname.includes('/panel/tests')) activeTab = 'tests';
  else if (pathname.includes('/panel/norms')) activeTab = 'norms';
  else if (pathname.includes('/panel/admins')) activeTab = 'admins';

  return (
    <div className="min-h-screen w-full bg-slate-50 font-body flex">
      <Sidebar 
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold text-lg tracking-tight">SuperAdmin</span>
          </div>
        }
        userWidget={
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">SA</div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-800 text-sm truncate">System Admin</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Root Access</div>
            </div>
          </div>
        }
        items={menuItems}
        activeTab={activeTab}
        onLogout={() => signOut({ callbackUrl: '/panel/login' })}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar title={menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
