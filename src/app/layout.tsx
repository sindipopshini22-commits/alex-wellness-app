import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alex",
  description: "Your brutally honest, deeply empathetic sounding board."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
