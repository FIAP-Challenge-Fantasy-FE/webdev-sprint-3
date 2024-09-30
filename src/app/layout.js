"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from '@/providers/theme-provider';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLivePage = pathname === '/live';

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {!isLivePage && <Header />}
          <main>{children}</main>
          {!isLivePage && <Footer />}
        </ThemeProvider>
      </body>
    </html>
  );
}