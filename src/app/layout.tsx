import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoleraVault",
  description: "Track. Blend. Drink. Share.",
  icons: {
    icon: "/brand/soleravault-app-icon.png",
    apple: "/brand/soleravault-app-icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
