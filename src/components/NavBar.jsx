// src/components/NavBar.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Iconimage from "../assets/icon.png";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

// Resolve a logo path coming from the DB into a full, loadable URL
const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

/* ============================================================
   SESSION ID
   Persists in sessionStorage for the tab's lifetime. Falls back
   to a random UUID if crypto.randomUUID isn't available.
   ============================================================ */
const getOrCreateSessionId = () => {
  try {
    let id = sessionStorage.getItem("haip_session_id");
    if (!id) {
      id =
        (crypto.randomUUID && crypto.randomUUID()) ||
        `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("haip_session_id", id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

/* ============================================================
   VISIT TRACKER
   Fires a POST whenever the route changes. Skips admin routes
   so we only measure public-site traffic. Ignores duplicate
   pings to the same URL within 2 seconds.
   ============================================================ */
let lastTrackedUrl = null;
let lastTrackedAt = 0;

const trackVisit = (pageUrl) => {
  if (!pageUrl) return;

  // Don't track the admin area — this widget only measures the public site
  if (pageUrl.startsWith("/admin")) return;

  const now = Date.now();
  if (lastTrackedUrl === pageUrl && now - lastTrackedAt < 2000) return;
  lastTrackedUrl = pageUrl;
  lastTrackedAt = now;

  const body = {
    page_url: pageUrl,
    referrer_url: document.referrer || null,
    session_id: getOrCreateSessionId(),
  };

  try {
    // Prefer sendBeacon when available — survives page unloads
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], {
        type: "application/json",
      });
      navigator.sendBeacon(`${API_BASE}/api/client/visits/track`, blob);
      return;
    }
  } catch {
    // fall through to fetch
  }

  fetch(`${API_BASE}/api/client/visits/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }).catch(() => {});
};

const PORTALS = [
  {
    label: "Student Portal",
    href: `${import.meta.env.VITE_SITE_URL}/student/login`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Staff Portal",
    href: `${import.meta.env.VITE_SITE_URL}/staff`,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.5 19c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "E-Portfolio",
    href: import.meta.env.VITE_EPORTFOLIO_URL || "https://eportifolio.hanikaaip.ac.rw",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 13.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "E-Learning",
    href: import.meta.env.VITE_SITE_URL,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 4L3 8.5l9 4.5 9-4.5L12 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 11v5c1.5 1.3 3.3 2 5 2s3.5-.7 5-2v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function ChevronIcon({ open }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      className={`haip-chevron${open ? " haip-chevron--open" : ""}`}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {open ? (
        <path
          d="M6 6L18 18M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M3.5 6.5H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3.5 12H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3.5 17.5H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="haip-search__spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="42 100" />
    </svg>
  );
}

function NavBar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const [navData, setNavData] = useState(null);
  const [loading, setLoading] = useState(true);
  const closeTimer = useRef(null);

  // --- Utility bar (mobile compact dropdown) ---
  const [utilityOpen, setUtilityOpen] = useState(false);

  // --- Search state ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchHasRun, setSearchHasRun] = useState(false);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const searchAbortRef = useRef(null);

  /* ============================================================
     VISIT TRACKING
     Fires once per unique route. Because NavBar is mounted on
     every public page, this replaces the need to add
     `fetch('/api/client/visits/track')` on each page individually.
     ============================================================ */
  useEffect(() => {
    const pageUrl = `${location.pathname}${location.search || ""}`;
    // Wait one tick so the page has actually painted before we ping
    const t = setTimeout(() => trackVisit(pageUrl), 50);
    return () => clearTimeout(t);
  }, [location.pathname, location.search]);

  // Fetch navigation data from API
  useEffect(() => {
    async function fetchNavData() {
      try {
        const response = await fetch(`${API_BASE}/api/client/navigation`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setNavData(data.data);
        } else {
          setNavData(getFallbackNavData());
        }
      } catch (error) {
        console.error("Failed to fetch navigation data:", error);
        setNavData(getFallbackNavData());
      } finally {
        setLoading(false);
      }
    }

    fetchNavData();
  }, []);

  // Fallback static navigation data
  const getFallbackNavData = () => ({
    links: [
      {
        label: "About",
        href: "/about",
        dropdown: {
          links: [
            { label: "About HAIP", href: "/about" },
            { label: "Mission & Vision", href: "/about#mission" },
            { label: "Leadership", href: "/about#leadership" },
            { label: "Campus Facilities", href: "/about#facilities" },
          ],
          highlight: {
            eyebrow: "Who we are",
            title: "A polytechnic built for practical futures",
            text: "Learn how Hanika Anglican Integrated Polytechnic prepares graduates with real, job-ready skills.",
            href: "/about",
            cta: "Read our story",
          },
        },
      },
      {
        label: "Academics",
        href: "/programs",
        dropdown: {
          links: [
            { label: "All Programs", href: "/programs" },
            { label: "Certificate Programs", href: "/programs?level=certificate" },
            { label: "Diploma Programs", href: "/programs?level=diploma" },
            { label: "Departments", href: "/departments" },
          ],
          highlight: {
            eyebrow: "Why choose HAIP",
            title: "Hands-on training, industry-linked skills",
            text: "Every program pairs classroom learning with practical, workshop-based training.",
            href: "/programs",
            cta: "Explore programs",
          },
        },
      },
      {
        label: "Admissions",
        href: "/admissions",
        dropdown: {
          links: [
            { label: "How to Apply", href: "/admissions#apply" },
            { label: "Entry Requirements", href: "/admissions#requirements" },
            { label: "Fees & Scholarships", href: "/admissions#fees" },
            { label: "Academic Calendar", href: "/admissions#calendar" },
          ],
          highlight: {
            eyebrow: "Intake open",
            title: "Start your application today",
            text: "New students are admitted every academic year. See dates, requirements, and next steps.",
            href: "/admissions#apply",
            cta: "Apply now",
          },
        },
      },
      { label: "News & Events", href: "/news" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contact", href: "/contact" },
    ],
    applyLink: "/admissions#apply",
    schoolName: "HANIKA",
    schoolSubtitle: "Anglican Integrated Polytechnic",
    logoUrl: null,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, searchOpen]);

  const openDropdown = (label) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  // --- Search logic ---
  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 30);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSearchHasRun(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchAbortRef.current) searchAbortRef.current.abort();
  };

  const runSearch = async (term) => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/client/search?q=${encodeURIComponent(term)}`,
        { credentials: "include", signal: controller.signal }
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.results || []);
      } else {
        setSearchResults([]);
        setSearchError("Something went wrong. Try again.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search failed:", err);
        setSearchResults([]);
        setSearchError("Couldn't reach the server. Try again.");
      }
    } finally {
      setSearching(false);
      setSearchHasRun(true);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchHasRun(false);
      setSearching(false);
      return;
    }

    searchDebounceRef.current = setTimeout(() => runSearch(trimmed), 300);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") closeSearch();
  };

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  const data = navData || getFallbackNavData();
  const navLinks = data.links || [];
  const applyLink = data.applyLink || "/admissions#apply";
  const schoolName = data.schoolName || "HANIKA";
  const schoolSubtitle = data.schoolSubtitle || "Anglican Integrated Polytechnic";

  const logoSrc = data.logoUrl ? resolveImage(data.logoUrl) : Iconimage;

  if (loading) {
    return (
      <>
        <div className="haip-utilitybar">
          <div className="haip-utilitybar__inner">
            <span className="haip-utilitybar__label">Quick access</span>
            <div className="haip-utilitybar__links">
              {PORTALS.map((p) => (
                <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" className="haip-utilitybar__link">
                  {p.icon}
                  <span>{p.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <header className="haip-header">
          <div className="haip-header__bar">
            <div className="haip-header__inner">
              <a href="/" className="haip-logo" aria-label="Home">
                <img src={logoSrc} className="haip-logo__img" alt="Logo" />
                <span className="haip-logo__text">
                  <span className="haip-logo__title">{schoolName}</span>
                  <span className="haip-logo__subtitle">{schoolSubtitle}</span>
                </span>
              </a>
              <div className="haip-actions">
                <button className="haip-icon-btn" aria-label="Search">
                  <SearchIcon />
                </button>
                <a href={applyLink} className="haip-btn haip-btn--primary">
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      {/* Utility bar — sits above the main header */}
      <div className="haip-utilitybar">
        <div className="haip-utilitybar__inner">
          <span className="haip-utilitybar__label">Quick access</span>

          <div className="haip-utilitybar__links">
            {PORTALS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="haip-utilitybar__link"
              >
                {p.icon}
                <span>{p.label}</span>
              </a>
            ))}
          </div>

          {/* Compact dropdown for narrow screens */}
          <div className="haip-utilitybar__compact">
            <button
              className="haip-utilitybar__toggle"
              onClick={() => setUtilityOpen((v) => !v)}
              aria-expanded={utilityOpen}
              aria-haspopup="true"
            >
              Portals
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                style={{ transform: utilityOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
              >
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {utilityOpen && (
              <div className="haip-utilitybar__menu" onMouseLeave={() => setUtilityOpen(false)}>
                {PORTALS.map((p) => (
                  <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer">
                    {p.icon}
                    <span>{p.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <header className={`haip-header${scrolled ? " haip-header--scrolled" : ""}`}>
        <div className="haip-header__bar">
          <div className="haip-header__inner">
            {/* Logo */}
            <a href="/" className="haip-logo" aria-label="Home">
              <img src={logoSrc} className="haip-logo__img" alt="Logo" />
              <span className="haip-logo__text">
                <span className="haip-logo__title">{schoolName}</span>
                <span className="haip-logo__subtitle">{schoolSubtitle}</span>
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="haip-nav" aria-label="Primary">
              <ul className="haip-nav__list">
                {navLinks.map((item) => (
                  <li
                    key={item.label}
                    className="haip-nav__item"
                    onMouseEnter={() => item.dropdown && openDropdown(item.label)}
                    onMouseLeave={() => item.dropdown && scheduleClose()}
                  >
                    <a
                      href={item.href || (item.dropdown ? item.dropdown.links[0]?.href || "#" : "#")}
                      className="haip-nav__link"
                      aria-haspopup={item.dropdown ? "true" : undefined}
                      aria-expanded={item.dropdown ? activeDropdown === item.label : undefined}
                      onClick={(e) => item.dropdown && e.preventDefault()}
                    >
                      {item.label}
                      {item.dropdown && <ChevronIcon open={activeDropdown === item.label} />}
                    </a>

                    {item.dropdown && (
                      <div
                        className={`haip-dropdown${activeDropdown === item.label ? " haip-dropdown--open" : ""}`}
                        onMouseEnter={() => openDropdown(item.label)}
                        onMouseLeave={scheduleClose}
                      >
                        <ul className="haip-dropdown__links">
                          {item.dropdown.links.map((l) => (
                            <li key={l.label}>
                              <a href={l.href}>{l.label}</a>
                            </li>
                          ))}
                        </ul>
                        {item.dropdown.highlight && (
                          <div className="haip-dropdown__highlight">
                            <span className="haip-dropdown__eyebrow">
                              {item.dropdown.highlight.eyebrow}
                            </span>
                            <h4>{item.dropdown.highlight.title}</h4>
                            <p>{item.dropdown.highlight.text}</p>
                            <a href={item.dropdown.highlight.href} className="haip-dropdown__cta">
                              {item.dropdown.highlight.cta}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right side actions */}
            <div className="haip-actions">
              <button className="haip-icon-btn" aria-label="Search" onClick={openSearch}>
                <SearchIcon />
              </button>
              <a href={applyLink} className="haip-btn haip-btn--primary">
                Apply Now
              </a>
              <button
                className="haip-icon-btn haip-menu-toggle"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <MenuIcon open={mobileOpen} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="haip-search" role="dialog" aria-modal="true" aria-label="Site search">
          <div className="haip-search__backdrop" onClick={closeSearch} />
          <div className="haip-search__panel">
            <div className="haip-search__bar">
              <SearchIcon />
              <input
                ref={searchInputRef}
                type="text"
                className="haip-search__input"
                placeholder="Search programs, departments, news…"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
              {searching && <SpinnerIcon />}
              <button className="haip-search__close" aria-label="Close search" onClick={closeSearch}>
                <CloseIcon />
              </button>
            </div>

            <div className="haip-search__body">
              {searchError && <p className="haip-search__error">{searchError}</p>}

              {!searchError && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                <p className="haip-search__hint">Keep typing to search…</p>
              )}

              {!searchError && searchHasRun && !searching && searchResults.length === 0 && (
                <p className="haip-search__empty">No results for "{searchQuery}"</p>
              )}

              {searchResults.length > 0 && (
                <ul className="haip-search__results">
                  {searchResults.map((r, i) => (
                    <li key={`${r.type}-${r.href}-${i}`}>
                      <a href={r.href} className="haip-search__result" onClick={closeSearch}>
                        <span className="haip-search__result-type">{r.type}</span>
                        <span className="haip-search__result-text">
                          <span className="haip-search__result-label">{r.label}</span>
                          {r.subtitle && (
                            <span className="haip-search__result-subtitle">{r.subtitle}</span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {!searchHasRun && !searchQuery && (
                <p className="haip-search__hint">
                  Try "diploma", "admissions", or a department name.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      <div className={`haip-mobile${mobileOpen ? " haip-mobile--open" : ""}`}>
        <div className="haip-mobile__panel">
          <ul className="haip-mobile__list">
            {navLinks.map((item) => (
              <li key={item.label} className="haip-mobile__item">
                {item.dropdown ? (
                  <>
                    <button
                      className="haip-mobile__link haip-mobile__link--toggle"
                      onClick={() =>
                        setMobileAccordion((cur) => (cur === item.label ? null : item.label))
                      }
                    >
                      {item.label}
                      <ChevronIcon open={mobileAccordion === item.label} />
                    </button>
                    <div
                      className={`haip-mobile__submenu${mobileAccordion === item.label ? " haip-mobile__submenu--open" : ""}`}
                    >
                      {item.dropdown.links.map((l) => (
                        <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}>
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    className="haip-mobile__link"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Portal quick links in mobile menu too */}
          <div className="haip-mobile__portals">
            {PORTALS.map((p) => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" className="haip-mobile__portal">
                {p.icon}
                <span>{p.label}</span>
              </a>
            ))}
          </div>

          <a href={applyLink} className="haip-btn haip-btn--primary haip-mobile__cta">
            Apply Now
          </a>
        </div>
      </div>
      {mobileOpen && <div className="haip-mobile__backdrop" onClick={() => setMobileOpen(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --haip-primary: #893C87;
          --haip-dark: #6F2F6D;
          --haip-light: #B96AAE;
          --haip-light-bg: #F3EAF2;
          --white: #FFFFFF;
          --haip-off-white: #EEECE7;
          --text-dark: #292329;
          --text-muted: #777277;
          --border: #E1D9E0;
          --success: #2E7D32;
          --warning: #D69E2E;
          --danger: #C62828;
        }

        /* Utility bar */
        .haip-utilitybar {
          width: 100%;
          background: var(--haip-dark);
          color: rgba(255,255,255,0.92);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 12.5px;
          position: relative;
          z-index: 110;
        }

        .haip-utilitybar__inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 7px 24px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 24px;
        }

        .haip-utilitybar__label {
          margin-right: auto;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .haip-utilitybar__links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .haip-utilitybar__link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 6px;
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .haip-utilitybar__link:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        .haip-utilitybar__compact {
          display: none;
          position: relative;
        }

        .haip-utilitybar__toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .haip-utilitybar__menu {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 16px 36px rgba(41,35,41,0.18);
          padding: 6px;
          display: flex;
          flex-direction: column;
          min-width: 190px;
          z-index: 250;
        }

        .haip-utilitybar__menu a {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 7px;
          color: var(--text-dark);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
        }

        .haip-utilitybar__menu a:hover {
          background: var(--haip-light-bg);
          color: var(--haip-primary);
        }

        .haip-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: var(--white);
          border-bottom: 1px solid transparent;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .haip-header--scrolled {
          border-bottom-color: var(--border);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.08);
        }

        .haip-header__bar { width: 100%; }

        .haip-header__inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 32px;
        }

        /* Logo */
        .haip-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .haip-logo__img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .haip-logo__text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .haip-logo__title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 21px;
          color: var(--text-dark);
          letter-spacing: 0.2px;
        }

        .haip-logo__subtitle {
          font-size: 11.5px;
          color: var(--text-muted);
          white-space: nowrap;
          max-width: 220px;
        }

        /* Desktop nav */
        .haip-nav {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .haip-nav__list {
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .haip-nav__item { position: static; }

        .haip-nav__link {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
          font-size: 14.5px;
          font-weight: 500;
          color: var(--text-dark);
          text-decoration: none;
          border-radius: 8px;
          transition: color 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }

        .haip-nav__link:hover {
          color: var(--haip-primary);
          background: var(--haip-light-bg);
        }

        .haip-chevron {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }

        .haip-chevron--open { transform: rotate(180deg); }

        /* Mega dropdown */
        .haip-dropdown {
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          margin-top: 1px;
          background: var(--white);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(41, 35, 41, 0.09);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-6px);
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
          display: grid;
          grid-template-columns: 1fr 380px;
        }

        .haip-dropdown--open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .haip-dropdown__links {
          list-style: none;
          margin: 0;
          padding: 28px clamp(24px, 6vw, 96px);
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 1240px;
          margin: 0 auto;
          width: 100%;
        }

        .haip-dropdown__links li a {
          display: block;
          padding: 10px 14px;
          margin: 0 -14px;
          border-radius: 8px;
          color: var(--text-dark);
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .haip-dropdown__links li a:hover {
          background: var(--haip-light-bg);
          color: var(--haip-primary);
        }

        .haip-dropdown__highlight {
          background: var(--haip-light-bg);
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-left: 1px solid var(--border);
        }

        .haip-dropdown__eyebrow {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--haip-primary);
        }

        .haip-dropdown__highlight h4 {
          margin: 8px 0 6px;
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--text-dark);
          line-height: 1.3;
        }

        .haip-dropdown__highlight p {
          margin: 0 0 14px;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--text-muted);
        }

        .haip-dropdown__cta {
          align-self: flex-start;
          font-size: 14px;
          font-weight: 600;
          color: var(--haip-dark);
          text-decoration: none;
          border-bottom: 1.5px solid var(--haip-light);
          padding-bottom: 2px;
        }

        .haip-dropdown__cta:hover {
          color: var(--haip-primary);
          border-color: var(--haip-primary);
        }

        /* Actions */
        .haip-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .haip-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          border: 1px solid var(--border);
          background: var(--white);
          color: var(--text-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .haip-icon-btn:hover {
          background: var(--haip-light-bg);
          border-color: var(--haip-light);
          color: var(--haip-primary);
        }

        .haip-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 22px;
          border-radius: 9px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
          white-space: nowrap;
        }

        .haip-btn--primary {
          background: var(--haip-primary);
          color: var(--white);
          box-shadow: 0 6px 16px rgba(137, 60, 135, 0.28);
        }

        .haip-btn--primary:hover {
          background: var(--haip-dark);
          transform: translateY(-1px);
        }

        .haip-menu-toggle { display: none; }

        /* Search overlay */
        .haip-search {
          position: fixed;
          inset: 0;
          z-index: 300;
        }

        .haip-search__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(41, 35, 41, 0.45);
        }

        .haip-search__panel {
          position: relative;
          max-width: 640px;
          margin: 90px auto 0;
          background: var(--white);
          border-radius: 14px;
          box-shadow: 0 24px 60px rgba(41, 35, 41, 0.28);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .haip-search__bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
          color: var(--text-muted);
        }

        .haip-search__input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: var(--text-dark);
          font-family: 'Inter', sans-serif;
          background: transparent;
        }

        .haip-search__spinner {
          animation: haip-spin 0.8s linear infinite;
          color: var(--haip-primary);
        }

        @keyframes haip-spin { to { transform: rotate(360deg); } }

        .haip-search__close {
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .haip-search__close:hover { color: var(--haip-primary); }

        .haip-search__body {
          max-height: 60vh;
          overflow-y: auto;
          padding: 8px;
        }

        .haip-search__hint,
        .haip-search__empty,
        .haip-search__error {
          padding: 20px 16px;
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
          margin: 0;
        }

        .haip-search__error { color: var(--danger); }

        .haip-search__results {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .haip-search__result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-dark);
        }

        .haip-search__result:hover { background: var(--haip-light-bg); }

        .haip-search__result-type {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: var(--haip-primary);
          background: var(--haip-light-bg);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .haip-search__result-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .haip-search__result-label {
          font-size: 14.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .haip-search__result-subtitle {
          font-size: 12.5px;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .haip-search__panel {
            margin: 0;
            max-width: 100%;
            border-radius: 0;
            height: 100%;
          }
          .haip-search__body {
            max-height: calc(100vh - 60px);
          }
        }

        /* Mobile menu */
        .haip-mobile {
          position: fixed;
          top: 0;
          right: 0;
          height: 100%;
          width: min(340px, 86vw);
          z-index: 200;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }

        .haip-mobile--open { transform: translateX(0); }

        .haip-mobile__panel {
          height: 100%;
          background: var(--white);
          box-shadow: -12px 0 32px rgba(41, 35, 41, 0.14);
          padding: 88px 24px 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .haip-mobile__backdrop {
          position: fixed;
          inset: 0;
          background: rgba(41, 35, 41, 0.35);
          z-index: 190;
        }

        .haip-mobile__list {
          list-style: none;
          margin: 0 0 20px;
          padding: 0;
        }

        .haip-mobile__item { border-bottom: 1px solid var(--border); }

        .haip-mobile__link {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 4px;
          font-size: 15.5px;
          font-weight: 500;
          color: var(--text-dark);
          text-decoration: none;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .haip-mobile__submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .haip-mobile__submenu--open {
          max-height: 320px;
          padding-bottom: 10px;
        }

        .haip-mobile__submenu a {
          padding: 9px 4px 9px 16px;
          font-size: 14.5px;
          color: var(--text-muted);
          text-decoration: none;
        }

        .haip-mobile__submenu a:hover { color: var(--haip-primary); }

        .haip-mobile__portals {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
        }

        .haip-mobile__portal {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 4px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
        }

        .haip-mobile__portal:hover { color: var(--haip-primary); }

        .haip-mobile__cta {
          width: 100%;
          margin-top: auto;
        }

        /* Responsive breakpoints */
        @media (max-width: 1080px) {
          .haip-nav { display: none; }
          .haip-menu-toggle { display: flex; }
          .haip-logo__subtitle { display: none; }
        }

        @media (max-width: 760px) {
          .haip-utilitybar__links { display: none; }
          .haip-utilitybar__compact { display: block; }
          .haip-utilitybar__label { display: none; }
          .haip-utilitybar__inner { justify-content: flex-end; padding: 6px 16px; }
        }

        @media (max-width: 480px) {
          .haip-header__inner {
            padding: 12px 16px;
            gap: 12px;
          }
          .haip-btn--primary {
            padding: 10px 16px;
            font-size: 13.5px;
          }
          .haip-logo__img {
            width: 40px;
            height: 40px;
          }
          .haip-logo__title { font-size: 18px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .haip-dropdown,
          .haip-mobile,
          .haip-mobile__submenu,
          .haip-chevron,
          .haip-btn--primary {
            transition: none !important;
          }
        }

        a:focus-visible,
        button:focus-visible {
          outline: 2px solid var(--haip-primary);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}

export default NavBar;