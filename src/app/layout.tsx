import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase Security Scanner",
  description: "Scan your Supabase project for common security misconfigurations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-sand-50 text-sand-900 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
