import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MedFlow Pro",
    template: "%s | MedFlow Pro",
  },
  description:
    "Manual-entry revenue cycle management MVP for patients, claims, payments, and denials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
