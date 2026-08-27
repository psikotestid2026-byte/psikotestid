import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Asesmen - Ruangtes',
  robots: 'noindex, nofollow',
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 min-h-screen text-slate-800">
      {children}
    </div>
  );
}
