import { Metadata } from 'next';
import { Albert_Sans, Source_Sans_3 } from 'next/font/google';
import { Toaster } from 'sonner';
import { sql } from '@/lib/neon';
import './globals.css';

const albertSans = Albert_Sans({
  subsets: ['latin'],
  variable: '--font-albert-sans',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
});

export const metadata: Metadata = {
  title: 'Ruangtes',
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
    <html lang="id" className={`${albertSans.variable} ${sourceSans.variable}`}>
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
