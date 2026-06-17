import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Dashboard',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 w-full h-screen overflow-hidden text-slate-800">
      {children}
    </div>
  );
}
