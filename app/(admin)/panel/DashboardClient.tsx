'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Shield, LayoutDashboard, Building2, FileSpreadsheet, Scroll } from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { TestsTab } from '@/components/admin/TestsTab';
import { NormsTab } from '@/components/admin/NormsTab';
import { approveOrder } from './actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardClient({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use SWR for client-side hydration & polling, seeded with initialData from SSR
  const { data, mutate } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000, // Poll every 15s to keep dashboard live
  });

  const handleApproveOrder = async (orderId: number) => {
    if (confirm('Approve order ini? Saldo kuota pelanggan akan langsung ditambahkan.')) {
      await approveOrder(orderId);
      mutate(); // Revalidate SWR data
    }
  };

  const menuItems: SidebarItem[] = [
    { id: 'overview', label: 'Ringkasan Sistem', icon: <LayoutDashboard /> },
    { id: 'customers', label: 'Perusahaan / Klien', icon: <Building2 /> },
    { id: 'tests', label: 'Master Alat Tes', icon: <FileSpreadsheet /> },
    { id: 'norms', label: 'Norma & Skoring', icon: <Scroll /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-body flex">
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
        onTabChange={setActiveTab}
        onLogout={() => window.location.href = '/'}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar title={menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'overview' && <OverviewTab data={data} onApproveOrder={handleApproveOrder} />}
          {activeTab === 'customers' && <CustomersTab data={data} />}
          {activeTab === 'tests' && <TestsTab data={data} />}
          {activeTab === 'norms' && <NormsTab />}
        </div>
      </main>
    </div>
  );
}
