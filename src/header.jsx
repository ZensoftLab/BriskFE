import { useEffect, useState } from "react";
import "./header.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Package", href: "/package/" },
  { label: "Offer", href: "/offer/" },
  { label: "Bill Pay", href: "/bill-pay/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
  { label: "Buisness Area", href: "/buisnessarea/", featured: true },
];

function normalizePath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/business-area") return "/buisnessarea";
  if (path === "/package-form") return "/package";
  return path;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = normalizePath(window.location.pathname);
  const active = (href) => normalizePath(href) === currentPath;

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-nav-active", mobileOpen);
    return () => document.documentElement.classList.remove("mobile-nav-active");
  }, [mobileOpen]);

  const renderLink = (item, mobile = false) => {
    const isActive = active(item.href);
    return (
      <a
        key={item.href}
        href={item.href}
        className={`brisk-nav-link ${item.featured ? "brisk-nav-featured" : ""} ${isActive ? "brisk-nav-active" : ""} ${mobile ? "brisk-mobile-link" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={mobile ? () => setMobileOpen(false) : undefined}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className="brisk-header">
      <div className="brisk-topbar">
        <div className="brisk-header-container brisk-topbar-content">
          <div className="brisk-contact-group">
            <a href="tel:01795094570" className="brisk-topbar-link"><svg aria-hidden="true" viewBox="0 0 24 24" className="brisk-contact-icon"><path d="M6.6 2.5 9.2 2l2 4.8-2.3 1.8a15.8 15.8 0 0 0 6.5 6.5l1.8-2.3 4.8 2-.5 2.6a2.5 2.5 0 0 1-2.7 2A17.5 17.5 0 0 1 4.6 5.2a2.5 2.5 0 0 1 2-2.7Z" /></svg><span>+8801795094570</span></a>
            <a href="mailto:info@briskinternet.net" className="brisk-topbar-link"><svg aria-hidden="true" viewBox="0 0 24 24" className="brisk-contact-icon"><path d="M3 5.5h18v13H3v-13Zm1.8 1.8 7.2 5.4 7.2-5.4M4.2 16.7l5.1-4m10.5 4-5.1-4" /></svg><span>info@briskinternet.net</span></a>
          </div>
          <a href="#" className="brisk-tariff-link">BTRC Approved Tariff</a>
        </div>
      </div>

      <div className="brisk-mainbar">
        <div className="brisk-header-container brisk-mainbar-content">
          <a href="/" className="brisk-brand" aria-label="Brisk Internet home">
            <img src="/images/brisk-systems.png" alt="Brisk Internet" />
          </a>
          <button type="button" className="brisk-menu-toggle" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><span aria-hidden="true">☰</span></button>
          <nav className="brisk-desktop-nav" aria-label="Primary navigation">{navigation.map((item) => renderLink(item))}</nav>
        </div>
      </div>

      {mobileOpen && <>
        <button type="button" className="brisk-mobile-overlay" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />
        <aside className="brisk-mobile-panel" aria-label="Mobile navigation">
          <button type="button" className="brisk-mobile-close" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}>×</button>
          <nav>{navigation.map((item) => renderLink(item, true))}</nav>
        </aside>
      </>}
    </header>
  );
}
