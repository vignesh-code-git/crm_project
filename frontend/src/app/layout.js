import "./globals.css";
import { Inter } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CRM | Sales & Automation",
  description: "High-fidelity professional CRM project.",
  icons: {
    icon: "/crm.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>

        {children}

        {/* Toast container */}
        <ToastProvider />

      </body>
    </html>
  );
}