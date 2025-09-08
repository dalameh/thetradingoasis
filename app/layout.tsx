import './globals.css';
import AppWrapper from './provider';
import WatchlistProvider from './WatchlistProvider';
import { Toaster } from 'sonner';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: 'The Trading Oasis',
  description: 'What you need, is what we have',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black m-0 p-0 overflow-y-scroll overscroll-contain`}
      >
        <AppWrapper>
          <WatchlistProvider>{children}</WatchlistProvider>
        </AppWrapper>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

// changed