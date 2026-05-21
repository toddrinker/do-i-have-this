import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wait, Do I Have This?",
  description: "Photograph a book cover or spine and instantly check your personal library inventory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
