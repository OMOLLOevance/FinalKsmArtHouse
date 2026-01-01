import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import ClientLayout from './ClientLayout';

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <QueryProvider>
              <AuthProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </AuthProvider>
            </QueryProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}