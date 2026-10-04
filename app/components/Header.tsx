"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  IconClipboard,
  IconClock,
  IconClose,
  IconDocument,
  IconHome,
  IconMenu,
  IconNewspaper,
  IconScroll,
  IconShield,
} from "./icons";

const LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/request-document", label: "Barangay Services", icon: IconDocument },
  { href: "/news", label: "News & Events", icon: IconNewspaper },
  { href: "/manage-services", label: "Track Requests", icon: IconClipboard },
  { href: "/terms-of-service", label: "Terms", icon: IconScroll },
  { href: "/privacy-policy", label: "Privacy", icon: IconShield },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="kb-public-header">
      <div className="kb-gov-strip" />
      <div className="kb-public-inner">
        <button
          type="button"
          className="kb-public-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <IconMenu size={20} />
        </button>

        <Link href="/" className="kb-public-logo" aria-label="KonektBarangay home">
          <Image src="/logo/logo.png" alt="KonektBarangay" width={270} height={84} priority />
        </Link>

        <nav className="kb-public-nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "is-active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={`kb-public-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`kb-public-drawer ${open ? "is-open" : ""}`} aria-label="Menu" aria-hidden={!open}>
        <div className="kb-public-drawer-head">
          <Link href="/" className="kb-sidebar-brand" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            <span className="kb-brand-mark">
              <Image src="/logo/logo-mark.png" alt="" width={34} height={34} />
            </span>
            <span>
              <strong>KonektBarangay</strong>
              <small>E-Services Portal</small>
            </span>
          </Link>
          <button
            type="button"
            className="kb-public-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={open ? 0 : -1}
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav className="kb-sidebar-nav">
          <p className="kb-nav-label">Menu</p>
          {LINKS.map((l) => {
            const Icon = l.icon;
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`kb-nav-link ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
              >
                <Icon size={20} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="kb-sidebar-hours">
          <strong>
            <IconClock size={16} /> Barangay Hall Hours
          </strong>
          <p>Monday – Friday · 8:00 AM – 5:00 PM</p>
        </div>
      </aside>
    </header>
  );
}
