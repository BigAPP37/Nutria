import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriAI — Tu nutricionista inteligente",
  description: "Registra lo que comes con IA. Sin fricción.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
