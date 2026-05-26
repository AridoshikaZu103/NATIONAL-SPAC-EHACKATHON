import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "National Space Hackathon | Explore the Cosmos",
  description:
    "An immersive 3D space exploration experience built for the National Space Hackathon. Discover missions, milestones, and the future of space technology.",
  keywords: [
    "space",
    "hackathon",
    "3D",
    "exploration",
    "ISRO",
    "NASA",
    "cosmos",
    "WebGL",
  ],
  openGraph: {
    title: "National Space Hackathon | Explore the Cosmos",
    description:
      "Immersive 3D space exploration experience for the National Space Hackathon.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
