import "~/styles/globals.css";
import { Providers } from "./providers";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Airtable",
  description: "Airtable",
  icons: [{ rel: "icon", url: "/airtable.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
