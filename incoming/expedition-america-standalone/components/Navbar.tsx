"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/cities", label: "Cities" },
  { href: "/experiences", label: "Experiences" },
  { href: "/events", label: "Events" },
  { href: "/deals", label: "Deals" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncViewport = () => {
      const desktop = mediaQuery.matches;
      setIsDesktop(desktop);

      if (desktop) {
        setIsOpen(false);
      }
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: "12px",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            margin: 0,
            fontSize: "1.1rem",
            lineHeight: 1.2,
          }}
        >
          Expedition America
        </h2>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#111827",
            cursor: "pointer",
            display: isDesktop ? "none" : "inline-flex",
          }}
        >
          {isOpen ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 7H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <div
          id="primary-navigation"
          style={{
            display: isDesktop ? "flex" : "none",
            gap: "24px",
            alignItems: "center",
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{
                color: pathname === link.href ? "#111827" : "#4b5563",
                textDecoration: "none",
                fontWeight: pathname === link.href ? 700 : 500,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {!isDesktop && isOpen && (
        <>
          <button
            type="button"
            aria-label="Close mobile menu overlay"
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(17, 24, 39, 0.45)",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              zIndex: 40,
            }}
          />

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "8px 20px 16px",
              display: "grid",
              gap: "4px",
              position: "relative",
              zIndex: 45,
              backgroundColor: "#ffffff",
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  padding: "10px 8px",
                  borderRadius: "8px",
                  color: pathname === link.href ? "#111827" : "#4b5563",
                  backgroundColor: pathname === link.href ? "#f3f4f6" : "transparent",
                  textDecoration: "none",
                  fontWeight: pathname === link.href ? 700 : 500,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}