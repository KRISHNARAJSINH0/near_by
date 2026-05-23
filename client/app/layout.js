import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { SocketProvider } from "@/context/SocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GeoTeam — Discover and Build Nearby Startup & Hackathon Teams",
  description: "GeoTeam is a premium real-time location platform connecting developers, co-founders, and freelance builders with nearby team recruitment polls on an interactive map.",
  keywords: ["nearby team finder", "startup team builder", "hackathon team finder", "geospatial developers", "co-founder matching"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col selection:bg-violet-500/30 selection:text-violet-200">
        <LocationProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
