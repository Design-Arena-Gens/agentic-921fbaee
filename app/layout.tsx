import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CallPilot – AI Appointment Caller",
  description: "Automate appointment scheduling calls with an AI-powered workflow."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
