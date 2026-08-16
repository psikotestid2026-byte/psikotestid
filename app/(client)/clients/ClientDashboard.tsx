'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import useSWR from 'swr';
import { Building, LayoutDashboard, Link as LinkIcon, Users, CreditCard, Settings, Wallet, PlusCircle } from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ClientOverviewTab } from '@/components/client/ClientOverviewTab';
import { CampaignsTab } from '@/components/client/CampaignsTab';
import { ParticipantsTab } from '@/components/client/ParticipantsTab';
import { BillingTab } from '@/components/client/BillingTab';
import { SettingsTab } from '@/components/client/SettingsTab';
import { Button } from '@/components/ui/Button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientDashboard({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [openTopUpModal, setOpenTopUpModal] = useState(false);

  const { data } = useSWR('/api/client/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  const { data: orderData } = useSWR('/api/client/orders', fetcher, {
    refreshInterval: 10000,
  });

  const walletBalance = orderData?.data?.balance ?? Number(data?.customer?.balance || 0);

  const handleOpenTopUp = () => {
    setActiveTab('billing');
    setOpenTopUpModal(true);
  };

  const menuItems: SidebarItem[] = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'campaigns', label: 'Sesi Tes (Campaign)', icon: <LinkIcon /> },
    { id: 'participants', label: 'Hasil Kandidat', icon: <Users /> },
    { id: 'billing', label: 'Beli Kuota Tes', icon: <CreditCard /> },
    { id: 'settings', label: 'Branding Portal', icon: <Settings /> }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 font-body flex">
      <Sidebar 
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0"><Building className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold text-lg tracking-tight">HR Portal</span>
          </div>
        }
        userWidget={
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
              {data.customer?.logo_url ? (
                <img src={data.customer.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">HR</div>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-800 text-sm truncate">{data.customer?.company_name || 'Loading...'}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Corporate Admin</div>
            </div>
          </div>
        }
        items={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => signOut({ callbackUrl: '/clients/login' })}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar 
          title={menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'} 
          rightWidget={
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saldo: Rp {Number(walletBalance).toLocaleString('id-ID')}</span>
              </div>

              <Button
                size="sm"
                onClick={handleOpenTopUp}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Top-Up Saldo
              </Button>

              <Button size="sm" variant="outline" onClick={() => setActiveTab('billing')} className="hidden md:inline-flex">
                Sisa Kuota: {data.quotas.reduce((acc: any, q: any) => acc + q.quota, 0)}
              </Button>
            </div>
          }
        />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'overview' && <ClientOverviewTab data={data} />}
          {activeTab === 'campaigns' && <CampaignsTab data={data} />}
          {activeTab === 'participants' && <ParticipantsTab data={data} />}
          {activeTab === 'billing' && <BillingTab data={data} openTopUpOnMount={openTopUpModal} />}
          {activeTab === 'settings' && <SettingsTab data={data} />}
        </div>
      </main>
    </div>
  );
}
