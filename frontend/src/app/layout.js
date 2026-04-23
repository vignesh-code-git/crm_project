import "./globals.css";

import ToastProvider from "@/components/ToastProvider";
export const metadata = {
  title: "CRM",
  description: "CRM PROJECT",
  icons: {
    icon: "crm.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        {children}

        {/* Toast container */}
        <ToastProvider />

      </body>
    </html>
  );
}