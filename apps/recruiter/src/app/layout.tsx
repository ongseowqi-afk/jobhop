import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobHop — Recruiter Portal",
  description: "Place candidates and earn commission",
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
