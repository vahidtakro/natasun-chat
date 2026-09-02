import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { AppThemeProvider } from "@/theme/theme-provider";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Natasun Chat",
    template: "%s · Natasun Chat",
  },
  description:
    "Natasun Chat — a lightweight, multi-tenant live chat system for your websites. Built by Natasun.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
