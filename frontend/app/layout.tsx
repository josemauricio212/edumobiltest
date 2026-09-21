import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "EduMobil", template: "%s · EduMobil" },
  description: "Transporte escolar organizado — toda rota leva à escola.",
};

export const viewport: Viewport = { themeColor: "#16213a" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
