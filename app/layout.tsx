import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata = {
  title: "KonektBarangay",
  description: "Barangay E-Services Portal",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
