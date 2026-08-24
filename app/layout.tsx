import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortify | Smart Glasses + WebXR Security Gateway",
  description: "Protótipo acadêmico de autenticação, confiança do dispositivo, Security Gateway e simulação WebXR/VR para acesso seguro à IA por dispositivos vestíveis."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
