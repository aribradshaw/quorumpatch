import type { Metadata } from 'next';
import { Newsreader, Public_Sans, Roboto_Mono } from 'next/font/google';
import './globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

const siteOrigin = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://github.com/aribradshaw/quorumpatch',
);

const title = 'QuorumPatch | Your agent wrote the fix. Prove it.';
const description =
  'Reproduce the bug. Test the patch. Take the fix away. Repair verification built with Solari, with real code and reviewable evidence.';

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${newsreader.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
