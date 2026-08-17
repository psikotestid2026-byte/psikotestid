import { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { sql } from '@/lib/neon';
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
  description: 'Platform Asesmen Psikotes Online Terintegrasi & Serverless',
  icons: {
    icon: [
      { url: '/branding-favicon.svg', type: 'image/svg+xml' },
      { url: '/branding-favicon.svg', type: 'image/png' },
    ],
    shortcut: '/branding-favicon.svg',
    apple: '/branding-favicon.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch dynamic custom favicon from DB if set by Superadmin
  let customFaviconUrl = '/branding-favicon.svg';
  try {
    const faviconRows = await sql`
      SELECT content FROM landing_page_contents WHERE section_key = 'site_favicon' LIMIT 1
    `;
    if (faviconRows.length > 0 && faviconRows[0].content?.favicon_url) {
      customFaviconUrl = faviconRows[0].content.favicon_url;
    }
  } catch (e) {
    // Fallback to official branding favicon
  }

  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href={customFaviconUrl} sizes="any" />
        <link rel="shortcut icon" href={customFaviconUrl} />
        <link rel="apple-touch-icon" href={customFaviconUrl} />
      </head>
      <body className="min-h-screen font-body antialiased text-slate-800 bg-slate-50">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
