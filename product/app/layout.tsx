import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ApplyPilot — Know your fit before you apply",
    template: "%s | ApplyPilot",
  },
  description:
    "Paste any job description and your resume to get an instant AI fit score, missing skills, and tailored tips. Apply smarter, not harder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}