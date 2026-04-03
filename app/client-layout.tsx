"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransitions";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const showFooter = pathname === "/";

  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>
      <Header open={menuOpen} setOpen={setMenuOpen} />

      <main className="page-content">
        <PageTransition>{children}</PageTransition>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
