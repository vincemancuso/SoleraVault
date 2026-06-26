import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoleraVault",
  description: "Track. Blend. Drink. Share."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
