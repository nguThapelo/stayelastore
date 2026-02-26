import './globals.css';

export const metadata = {
  title: 'Township Banking',
  description: 'Production-ready banking platform for township entrepreneurs in South Africa',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fb8c00',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}