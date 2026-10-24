import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Tuition App | Personal AI Tutor for Classes 1st to 8th - ₹200/Month',
  description:
    'Real-time voice doubt solving, NCERT aligned curriculum, and instant homework scanner with Neha Mam & Sharma Sir for Indian primary and middle school students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
