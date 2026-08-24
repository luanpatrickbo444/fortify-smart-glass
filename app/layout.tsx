import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortify | Acesso Seguro à IA por Smart Glasses",
  description: "Protótipo acadêmico de autenticação, confiança do dispositivo e gateway seguro para acesso à IA por Smart Glasses no desafio Petrobras / SENAI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
