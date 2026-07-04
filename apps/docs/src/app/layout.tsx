import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Niva Docs',
  description: 'Architecture and learning handbook for the Niva product stack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
