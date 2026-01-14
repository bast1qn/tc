import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gewährleistungsanfrage | Town & Country Haus",
  description: "Reichen Sie Ihre Gewährleistungsanfrage bei Town & Country Haus ein.",
  keywords: ["Gewährleistung", "Town & Country", "Hausbau", "Reklamation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${outfit.variable} antialiased min-h-screen`} suppressHydrationWarning>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
