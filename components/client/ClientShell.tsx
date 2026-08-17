'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import useSWR from 'swr';
import { Building, LayoutDashboard, Link as LinkIcon, Users, CreditCard, Settings, Wallet, PlusCircle, LogOut, Ticket } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';

interface ClientShellProps {
  initialData: any;
  children: React.ReactNode;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ClientShell({ initialData, children }: ClientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { data } = useSWR('/api/client/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  const { data: orderData } = useSWR('/api/client/orders', fetcher, {
    refreshInterval: 10000,
  });

  // Standalone Layout Guard for Login Page (No Sidebar, No TopBar)
  if (pathname === '/clients/login') {
    return <div className="min-h-screen w-full bg-slate-50 font-body">{children}</div>;
  }

  const walletBalance = orderData?.data?.balance ?? Number(data?.customer?.balance || 0);
  const quotas = data?.quotas || [];
  const totalQuotas = quotas.reduce((acc: any, q: any) => acc + (q.quota || 0), 0);

  const menuItems = [
    { href: '/clients', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/clients/campaigns', label: 'Sesi Tes (Campaign)', icon: <LinkIcon className="w-4 h-4" /> },
    { href: '/clients/participants', label: 'Hasil Kandidat', icon: <Users className="w-4 h-4" /> },
    { href: '/clients/billing', label: 'Beli Kuota & Katalog', icon: <CreditCard className="w-4 h-4" /> },
    { href: '/clients/settings', label: 'Branding Portal', icon: <Settings className="w-4 h-4" /> },
  ];

  const getPageTitle = () => {
    if (pathname.startsWith('/clients/campaigns/')) return 'Detail Sesi Tes & Pendaftaran Kandidat';
    if (pathname === '/clients/campaigns') return 'Sesi Tes (Campaign)';
    if (pathname.startsWith('/clients/participants/')) return 'Laporan Individu Hasil Kandidat';
    if (pathname === '/clients/participants') return 'Hasil Kandidat & Laporan';
    if (pathname === '/clients/billing') return 'Katalog Tes & Beli Kuota Wallet';
    if (pathname === '/clients/settings') return 'Branding Portal Corporate';
    return 'Dashboard Overview';
  };

  const handleNavigate = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-body flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0 z-30 shrink-0">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/clients" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-colors">
              <Building className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              HR Portal
            </span>
          </Link>
        </div>

        {/* Customer Profile Widget */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
              {data?.customer?.logo_url ? (
                <img src={data.customer.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {data?.customer?.company_name?.slice(0, 2)?.toUpperCase() || 'HR'}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-800 text-xs truncate">
                {data?.customer?.company_name || 'Corporate HR'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Corporate Admin</div>
            </div>
          </div>
        </div>

        {/* Multi-Routes Menu Links with Instant Transitions */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/clients' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(item.href);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => signOut({ callbackUrl: '/clients/login' })}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <TopBar
          title={getPageTitle()}
          rightWidget={
            <div className="flex items-center space-x-2">
              {/* Saldo Wallet Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saldo: Rp {Number(walletBalance).toLocaleString('id-ID')}</span>
              </div>

              <Link href="/clients/billing?topup=true">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> + Top-Up Saldo
                </Button>
              </Link>

              {/* Per-Test Quota Balance Badge */}
              <Link href="/clients/billing" className="hidden lg:inline-flex">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all">
                  <Ticket className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>
                    {quotas.length === 0 ? (
                      `Sisa Kuota: ${totalQuotas}`
                    ) : (
                      quotas.map((q: any) => `${q.test_code?.toUpperCase() || 'TES'}: ${q.quota}`).join(' | ')
                    )}
                  </span>
                </div>
              </Link>
            </div>
          }
        />

        {/* Children Page Slot with Instant Transition Container */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 transition-opacity duration-150 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
