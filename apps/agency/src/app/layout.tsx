import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobHop — Agency Portal",
  description: "Unified recruitment and workforce management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
