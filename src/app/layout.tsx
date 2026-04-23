import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatAssistant } from "@/components/ChatAssistant";
import { MarketTicker } from "@/components/ui/MarketTicker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NGA Inversiones | Estrategias de Inversión y Cambio en Rosario",
  description: "NGA Inversiones: 65 años de trayectoria en el mercado financiero argentino. Cotizaciones en vivo de Dólar Blue, Bonos y Acciones.",
  keywords: ["inversiones rosario", "dolar blue", "cotizacion bonos argentina", "al30", "merval en vivo", "cambio divisas rosario"],
  openGraph: {
    type: "website",
    url: "https://ngainversiones.com/",
    siteName: "NGA Inversiones",
    title: "NGA Inversiones | Liderazgo Financiero",
    description: "Protegemos tu legado con estrategias de inversión sofisticadas y datos de mercado en tiempo real.",
    images: ["https://scontent.fros8-1.fna.fbcdn.net/v/t39.30808-1/348431323_258445666706358_5973766118846707652_n.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "NGA Inversiones | Mercado en Vivo",
    description: "Cotizaciones de bonos, acciones y divisas con la solidez de 65 años de trayectoria.",
    images: ["https://scontent.fros8-1.fna.fbcdn.net/v/t39.30808-1/348431323_258445666706358_5973766118846707652_n.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <MarketTicker />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <ChatAssistant />
      </body>
    </html>
  );
}
