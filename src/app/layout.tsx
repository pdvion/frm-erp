import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EnsureUserProvider } from "@/components/EnsureUserProvider";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POC Delphi FRM - Sistema ERP",
  description: "Sistema de gestão industrial - Materiais, Fornecedores e Estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <TRPCProvider>
              <EnsureUserProvider>
                <a href="#main-content" className="skip-link">
                  Pular para o conteúdo principal
                </a>
                <AppLayout>{children}</AppLayout>
                <Toaster />
              </EnsureUserProvider>
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
