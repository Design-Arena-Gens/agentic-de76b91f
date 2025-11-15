import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calcul de Th?me Astral",
  description: "Outil local et fiable pour calculer votre th?me astral (Soleil, Ascendant, MC, maisons ?gales)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
