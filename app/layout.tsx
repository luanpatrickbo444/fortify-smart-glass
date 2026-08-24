import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortify | Smart Access • Petrobras",
  description: "Protótipo de autenticação e acesso seguro para Smart Glasses em ambiente corporativo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
