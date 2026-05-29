import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIEMS — Venus Enterprises Inventory Management",
  description: "Venus Enterprises Internal Inventory Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
