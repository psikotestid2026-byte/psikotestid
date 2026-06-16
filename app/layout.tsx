import { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'PsikoTest.id Enterprise',
  description: 'Platform B2B SaaS Asesmen Psikologi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body className="min-h-screen font-body antialiased text-slate-800 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
