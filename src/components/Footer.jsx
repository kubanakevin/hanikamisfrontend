// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Footer = ({ contact }) => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Colors matching the new design
  const colors = {
    primary: "#893C87",
    primaryDark: "#6F2F6D",
    primaryLight: "#A85AA6",
    gold: "#FFD700",
    goldLight: "#FFA500",
    white: "#FFFFFF",
    textDark: "#241F24",
    textMuted: "#B0A8A8",
    border: "#E1D9E0",
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer className="school-footer">
      {/* Scroll to Top Button */}
      <button
        className={`scroll-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 4l-8 8h6v8h4v-8h6z"/>
        </svg>
      </button>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-container">
          {/* Logo & About */}
          <div className="footer-column footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/>
                  <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="3"/>
                </svg>
              </div>
              <div className="logo-text">
                <h3>HAIP</h3>
                <span>Hanika Anglican Integrated Polytechnic</span>
              </div>
            </div>
            <p className="footer-motto">
              "All Things Cohere in Christ for Common Good"
            </p>
            <p className="footer-about">
              Committed to excellence in education, fostering innovation,
              critical thinking, and character development in every student.
            </p>
            <div className="footer-accreditation">
              <span className="accred-badge">✓ Accredited</span>
              <span className="accred-badge">★ Excellence</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/programs">Programs</Link></li>
              <li><Link to="/departments">Departments</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/news">News</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-column">
            <h4>Contact Us</h4>
            {contact && (
              <div className="footer-contact">
                {contact.address && (
                  <div className="footer-contact-item">
                    <span className="footer-icon">📍</span>
                    <span>{contact.address}</span>
                  </div>
                )}
                {contact.phone_primary && (
                  <div className="footer-contact-item">
                    <span className="footer-icon">📞</span>
                    <a href={`tel:${contact.phone_primary}`}>
                      {contact.phone_primary}
                    </a>
                  </div>
                )}
                {contact.phone_secondary && (
                  <div className="footer-contact-item footer-contact-sub">
                    <span className="footer-icon">📱</span>
                    <a href={`tel:${contact.phone_secondary}`}>
                      {contact.phone_secondary}
                    </a>
                  </div>
                )}
                {contact.email_primary && (
                  <div className="footer-contact-item">
                    <span className="footer-icon">✉️</span>
                    <a href={`mailto:${contact.email_primary}`}>
                      {contact.email_primary}
                    </a>
                  </div>
                )}
                {contact.office_hours && (
                  <div className="footer-contact-item">
                    <span className="footer-icon">🕐</span>
                    <span>{contact.office_hours}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Social & Newsletter */}
          <div className="footer-column">
            <h4>Connect With Us</h4>
            <div className="footer-social">
              {contact?.facebook_url && (
                <a 
                  href={contact.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {contact?.twitter_url && (
                <a 
                  href={contact.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Twitter"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {contact?.instagram_url && (
                <a 
                  href={contact.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              )}
              {contact?.linkedin_url && (
                <a 
                  href={contact.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {contact?.youtube_url && (
                <a 
                  href={contact.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="YouTube"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {contact?.whatsapp_number && (
                <a 
                  href={`https://wa.me/${contact.whatsapp_number}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <h5>Subscribe to Newsletter</h5>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <p>
            &copy; {currentYear} Hanika Anglican Integrated Polytechnic. All Rights Reserved.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-divider">|</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="footer-divider">|</span>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>

      <style>{`
        /* ============================================================
           SCHOOL FOOTER STYLES - Purple Background with White/Gold
           ============================================================ */

        .school-footer {
          background: linear-gradient(135deg, #1a0a1e 0%, #2d1b3d 25%, #4a2066 50%, #3d1d5c 75%, #2a1543 100%);
          color: #B0A8A8;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          border-top: 4px solid #cc6300;
          position: relative;
        }

        /* ===== Scroll to Top Button ===== */
        .scroll-top-btn {
          position: fixed;
          bottom: 30px;
          left: 30px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd900, #ffa600);
          color: #1a0a1e;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(20px) scale(0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
          z-index: 1000;
        }

        .scroll-top-btn.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .scroll-top-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 30px rgba(255, 215, 0, 0.4);
        }

        .scroll-top-btn:active {
          transform: scale(0.95);
        }

        .scroll-top-btn svg {
          width: 24px;
          height: 24px;
          transition: transform 0.3s ease;
        }

        .scroll-top-btn:hover svg {
          transform: translateY(-2px);
        }

        /* ===== Main Footer ===== */
        .footer-main {
          padding: 64px 24px 48px;
          background: rgba(26, 10, 30, 0.3);
          backdrop-filter: blur(10px);
        }

        .footer-container {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          gap: 48px;
        }

        /* ===== Brand / Logo Column ===== */
        .footer-brand {
          display: flex;
          flex-direction: column;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .logo-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #524500, #FFA500);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
        }

        .logo-icon svg {
          color: #1a0a1e;
        }

        .logo-text h3 {
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: 1px;
        }

        .logo-text span {
          font-size: 12px;
          color: #B0A8A8;
          display: block;
          letter-spacing: 0.5px;
        }

        .footer-motto {
          font-size: 14px;
          color: #6b5b01;
          font-style: italic;
          margin: 0 0 12px 0;
          padding: 8px 16px;
          border-left: 3px solid #383001;
          background: rgba(255, 215, 0, 0.05);
          border-radius: 0 8px 8px 0;
        }

        .footer-about {
          font-size: 14px;
          line-height: 1.8;
          color: #B0A8A8;
          margin: 0 0 16px 0;
        }

        .footer-accreditation {
          display: flex;
          gap: 12px;
        }

        .accred-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        /* ===== Footer Columns ===== */
        .footer-column h4 {
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
          letter-spacing: 0.5px;
          position: relative;
          padding-bottom: 12px;
        }

        .footer-column h4::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 32px;
          height: 2px;
          background: #FFD700;
        }

        /* ===== Quick Links ===== */
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 10px;
        }

        .footer-links a {
          color: #B0A8A8;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .footer-links a::before {
          content: '›';
          color: #FFD700;
          font-weight: 700;
          transition: transform 0.2s ease;
        }

        .footer-links a:hover {
          color: #FFFFFF;
          transform: translateX(4px);
        }

        .footer-links a:hover::before {
          transform: translateX(2px);
        }

        /* ===== Contact ===== */
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: #B0A8A8;
          line-height: 1.5;
        }

        .footer-contact-sub {
          padding-left: 28px;
        }

        .footer-contact-item a {
          color: #B0A8A8;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-contact-item a:hover {
          color: #FFD700;
        }

        .footer-icon {
          flex-shrink: 0;
          font-size: 16px;
          width: 20px;
          text-align: center;
          margin-top: 1px;
        }

        /* ===== Social & Newsletter ===== */
        .footer-social {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          color: #B0A8A8;
          transition: all 0.3s ease;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social-link:hover {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #1a0a1e;
          transform: translateY(-3px);
          border-color: #FFD700;
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.3);
        }

        .social-link svg {
          width: 18px;
          height: 18px;
        }

        /* ===== Newsletter ===== */
        .footer-newsletter h5 {
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          margin: 0 0 10px 0;
        }

        .newsletter-form {
          display: flex;
          gap: 8px;
        }

        .newsletter-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          font-size: 13px;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .newsletter-input::placeholder {
          color: #6A6260;
        }

        .newsletter-input:focus {
          outline: none;
          border-color: #FFD700;
          background: rgba(255, 255, 255, 0.08);
        }

        .newsletter-btn {
          padding: 10px 18px;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #1a0a1e;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .newsletter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
        }

        /* ===== Footer Bottom ===== */
        .footer-bottom {
          padding: 18px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 215, 0, 0.1);
        }

        .footer-bottom .footer-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          grid-template-columns: 1fr auto;
          gap: 20px;
        }

        .footer-bottom p {
          font-size: 13px;
          color: #6A6260;
          margin: 0;
        }

        .footer-bottom-links {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-bottom-links a {
          color: #6A6260;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .footer-bottom-links a:hover {
          color: #FFD700;
        }

        .footer-divider {
          color: #4a3a4a;
          font-size: 14px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          
          .footer-bottom .footer-container {
            flex-direction: column;
            text-align: center;
          }

          .footer-bottom-links {
            flex-wrap: wrap;
            justify-content: center;
          }

          .scroll-top-btn {
            bottom: 20px;
            left: 20px;
            width: 44px;
            height: 44px;
          }
        }

        @media (max-width: 640px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .footer-main {
            padding: 40px 16px 32px;
          }

          .footer-logo {
            flex-direction: column;
            text-align: center;
          }

          .logo-text h3 {
            font-size: 20px;
          }

          .footer-column h4::after {
            left: 50%;
            transform: translateX(-50%);
          }

          .footer-column h4 {
            text-align: center;
          }

          .footer-motto {
            text-align: center;
            border-left: none;
            border-top: 3px solid #FFD700;
            padding: 12px 0;
          }

          .footer-about {
            text-align: center;
          }

          .footer-accreditation {
            justify-content: center;
          }

          .footer-social {
            justify-content: center;
          }

          .footer-contact-item {
            justify-content: center;
          }

          .newsletter-form {
            flex-direction: column;
          }

          .newsletter-btn {
            width: 100%;
          }

          .footer-bottom .footer-container {
            flex-direction: column;
            text-align: center;
          }

          .footer-bottom-links {
            flex-wrap: wrap;
            justify-content: center;
          }

          .scroll-top-btn {
            bottom: 16px;
            left: 16px;
            width: 40px;
            height: 40px;
          }
        }

        /* ===== Smooth animations ===== */
        @media (prefers-reduced-motion: no-preference) {
          .social-link,
          .footer-links a,
          .newsletter-btn,
          .scroll-top-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;