import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/providers/query-provider';
import ClientLayout from './ClientLayout';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "KSM.ART HOUSE | Business Management",
    template: "%s | KSM.ART HOUSE"
  },
  description: "Professional business management system for events, gym, sauna, and restaurant operations.",
  keywords: ["business management", "event management", "gym", "restaurant", "sauna"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}