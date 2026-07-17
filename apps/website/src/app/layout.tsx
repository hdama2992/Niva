import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Niva | Real friendships, made by showing up',
  description:
    'Niva helps verified women in Bangalore build real friendships through small gatherings and continuing circles.',
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
