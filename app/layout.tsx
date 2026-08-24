import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortify | Secure Smart Glasses Access",
  description: "Camada segura de autenticação e acesso para Smart Glasses"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
