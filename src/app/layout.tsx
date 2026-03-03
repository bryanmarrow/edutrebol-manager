import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Asistencia Secu",
  description: "Sistema de control de asistencia escolar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Asistencia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on input focus for iOS
  viewportFit: "cover",
  themeColor: "#181818",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-[#F5F5F5] text-[#181818] min-h-screen pb-safe`}>
        {children}
      </body>
    </html>
  );
}
