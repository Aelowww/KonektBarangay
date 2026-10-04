"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppShell from "./components/AppShell";
import PageTransition from "./components/PageTransitions";
import { AuthProvider, useAuth } from "./components/AuthProvider";

const AUTH_PAGES = ["/login", "/register", "/verify-email", "/reset-password"];

function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolved, user } = useAuth();
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (pathname === "/admin/login") {
    return <main className="public-shell">{children}</main>;
  }

  if (!resolved && !isAuthPage) {
    return (
      <div className="kb-loader" style={{ minHeight: "100vh" }} role="status" aria-live="polite" aria-label="Loading">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
        </div>
      </div>
    );
  }

  if (resolved && user && !isAuthPage) {
    return (
      <AppShell>
        <PageTransition>{children}</PageTransition>
      </AppShell>
    );
  }

  const showFooter = pathname === "/" || pathname === "/request-document";

  return (
    <div className="public-shell">
      <Header />
      <main className="public-content">
        <PageTransition>{children}</PageTransition>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Chrome>{children}</Chrome>
    </AuthProvider>
  );
}
