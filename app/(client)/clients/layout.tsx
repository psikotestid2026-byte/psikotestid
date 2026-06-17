import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Dashboard - PsikoTest.id Enterprise',
  robots: 'noindex, nofollow',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 w-full h-screen overflow-hidden text-slate-800">
      {children}
    </div>
  );
}
