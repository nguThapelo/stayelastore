import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',  // ✅ Fixes font loading
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'StayelaBank - Spaza Shop Banking',
  description: 'AI-powered banking for township businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

