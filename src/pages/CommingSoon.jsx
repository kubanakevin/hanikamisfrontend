import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiShoppingBag,
  FiStar,
  FiArrowUpRight,
} from "react-icons/fi";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const ComingSoon = ({
  title = "Something New Is Coming",
  description = "We're putting the finishing touches on this C6Club experience. Come back soon and discover what's waiting for you.",
}) => {
  return (
    <>
      <NavBar />

      <main className="c6-coming-page">

        {/* Top mini label */}
        <div className="c6-coming-top">
          <span className="c6-coming-line"></span>
          <span>C6 CLUB</span>
          <span className="c6-coming-line"></span>
        </div>

        <section className="c6-coming-hero">

          {/* LEFT SIDE */}
          <div className="c6-coming-content">

            <div className="c6-coming-eyebrow">
              <span className="c6-coming-dot"></span>
              COMING SOON
            </div>

            <h1>
              {title}
              <span className="c6-coming-highlight">
                Just for You.
              </span>
            </h1>

            <p className="c6-coming-description">
              {description}
            </p>

            <div className="c6-coming-actions">
              <Link to="/" className="c6-coming-primary">
                <FiArrowLeft size={17} />
                Back to Home
              </Link>

              <Link to="/market-wholesale" className="c6-coming-secondary">
                Explore C6Club
                <FiArrowUpRight size={17} />
              </Link>
            </div>

            <div className="c6-coming-note">
              <FiClock size={16} />
              <span>
                We're working on something worth waiting for.
              </span>
            </div>
          </div>


          {/* RIGHT SIDE */}
          <div className="c6-coming-visual">

            <div className="c6-coming-circle circle-one"></div>
            <div className="c6-coming-circle circle-two"></div>

            <div className="c6-coming-card">

              {/* Logo */}
              <div className="c6-coming-logo">
                <div className="c6-logo-circle">
                  <span>C6</span>
                </div>

                <div className="c6-logo-club">
                  CLUB
                </div>
              </div>

              <div className="c6-coming-card-line"></div>

              <div className="c6-coming-card-icon">
                <FiShoppingBag size={30} />
              </div>

              <span className="c6-coming-card-small">
                C6 CLUB EXPERIENCE
              </span>

              <h2>
                Coming
                <br />
                <span>Soon</span>
              </h2>

              <p>
                Discover more.
                <br />
                Spend less.
                <br />
                Love more.
              </p>

              <div className="c6-coming-stars">
                <FiStar size={13} fill="currentColor" />
                <FiStar size={13} fill="currentColor" />
                <FiStar size={13} fill="currentColor" />
              </div>

            </div>

            {/* Floating badge */}
            <div className="c6-coming-floating">
              <div className="c6-floating-icon">
                <FiStar size={16} />
              </div>

              <div>
                <strong>New experience</strong>
                <span>Coming soon</span>
              </div>
            </div>

          </div>

        </section>


        {/* Bottom message */}
        <section className="c6-coming-bottom">

          <div className="c6-coming-bottom-item">
            <strong>01</strong>
            <span>Shop</span>
          </div>

          <div className="c6-coming-bottom-item">
            <strong>02</strong>
            <span>Order</span>
          </div>

          <div className="c6-coming-bottom-item">
            <strong>03</strong>
            <span>Discover</span>
          </div>

          <div className="c6-coming-bottom-title">
            Everything you need.
            <b> One place.</b>
          </div>

        </section>

      </main>

      <Footer />


      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap'
        );


        :root {
          --c6-ink: #060b16;
          --c6-cream: #f4f6fb;
          --c6-red: #b3273f;
          --c6-gold: #d9a520;
          --c6-gold-light: #ffd166;
          --c6-line: #e6e9f2;
          --c6-surface: #ffffff;
          --c6-text: #12181f;
          --c6-text-light: #67707c;
          --c6-bg: #f3f5f9;
        }


        * {
          box-sizing: border-box;
        }


        .c6-coming-page {
          min-height: 75vh;
          background: var(--c6-bg);
          font-family: 'Inter', sans-serif;
          color: var(--c6-text);
          padding: 35px 20px 70px;
          overflow: hidden;
        }


        /* TOP */

        .c6-coming-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: 3px;

          color: var(--c6-text-light);

          margin-bottom: 55px;
        }


        .c6-coming-line {
          width: 45px;
          height: 1px;
          background: var(--c6-line);
        }


        /* HERO */

        .c6-coming-hero {
          max-width: 1150px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: 1fr 0.9fr;

          align-items: center;

          gap: 80px;
        }


        /* CONTENT */

        .c6-coming-content {
          padding: 20px 0;
        }


        .c6-coming-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          color: var(--c6-red);

          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;

          margin-bottom: 20px;
        }


        .c6-coming-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: var(--c6-red);

          animation: c6-pulse 1.8s infinite;
        }


        @keyframes c6-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .4;
            transform: scale(.7);
          }
        }


        .c6-coming-content h1 {
          font-family: 'Fraunces', serif;

          font-size: clamp(48px, 6vw, 78px);

          line-height: 1.02;

          font-weight: 600;

          letter-spacing: -2px;

          margin: 0;

          color: var(--c6-ink);
        }


        .c6-coming-highlight {
          display: block;

          color: var(--c6-red);

          font-style: italic;

          font-weight: 500;

          margin-top: 5px;
        }


        .c6-coming-description {
          max-width: 570px;

          font-size: 15px;

          line-height: 1.8;

          color: var(--c6-text-light);

          margin: 25px 0 30px;
        }


        /* BUTTONS */

        .c6-coming-actions {
          display: flex;
          align-items: center;

          gap: 12px;

          flex-wrap: wrap;
        }


        .c6-coming-primary,
        .c6-coming-secondary {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 8px;

          text-decoration: none;

          padding: 13px 20px;

          border-radius: 8px;

          font-size: 13px;
          font-weight: 700;

          transition: .25s ease;
        }


        .c6-coming-primary {
          background: var(--c6-ink);
          color: white;

          box-shadow:
            0 8px 20px rgba(6, 11, 22, .15);
        }


        .c6-coming-primary:hover {
          background: var(--c6-red);
          transform: translateY(-2px);
        }


        .c6-coming-secondary {
          color: var(--c6-text);

          border: 1px solid var(--c6-line);

          background: white;
        }


        .c6-coming-secondary:hover {
          border-color: var(--c6-gold);
          color: var(--c6-gold);
        }


        /* NOTE */

        .c6-coming-note {
          display: flex;
          align-items: center;

          gap: 9px;

          margin-top: 25px;

          color: var(--c6-text-light);

          font-size: 11px;
        }


        .c6-coming-note svg {
          color: var(--c6-gold);
        }


        /* VISUAL */

        .c6-coming-visual {
          position: relative;

          min-height: 500px;

          display: flex;
          align-items: center;
          justify-content: center;
        }


        /* CIRCLES */

        .c6-coming-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;
        }


        .circle-one {
          width: 430px;
          height: 430px;

          border: 1px solid rgba(217, 165, 32, .25);
        }


        .circle-two {
          width: 350px;
          height: 350px;

          border: 1px solid rgba(179, 39, 63, .15);
        }


        /* CARD */

        .c6-coming-card {
          width: 310px;
          min-height: 400px;

          position: relative;
          z-index: 2;

          background: var(--c6-ink);

          border-radius: 22px;

          padding: 35px 30px;

          text-align: center;

          color: white;

          box-shadow:
            0 30px 70px rgba(6, 11, 22, .22);

          border: 1px solid rgba(255,255,255,.08);
        }


        /* LOGO */

        .c6-coming-logo {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          margin-bottom: 18px;
        }


        .c6-logo-circle {
          width: 54px;
          height: 54px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: var(--c6-gold);

          color: var(--c6-ink);

          font-family: 'Fraunces', serif;

          font-size: 22px;
          font-weight: 700;

          box-shadow:
            0 8px 25px rgba(217,165,32,.25);
        }


        .c6-logo-club {
          font-size: 15px;

          letter-spacing: 4px;

          font-weight: 800;

          color: white;
        }


        .c6-coming-card-line {
          width: 55px;
          height: 2px;

          background: var(--c6-red);

          margin: 0 auto 25px;
        }


        .c6-coming-card-icon {
          width: 60px;
          height: 60px;

          border-radius: 50%;

          margin: 0 auto 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--c6-gold);

          background: rgba(217,165,32,.1);

          border: 1px solid rgba(217,165,32,.2);
        }


        .c6-coming-card-small {
          font-size: 8px;

          font-weight: 800;

          letter-spacing: 2px;

          color: rgba(255,255,255,.5);
        }


        .c6-coming-card h2 {
          font-family: 'Fraunces', serif;

          font-size: 47px;

          line-height: .95;

          font-weight: 500;

          margin: 18px 0;

          color: white;
        }


        .c6-coming-card h2 span {
          color: var(--c6-gold);
          font-style: italic;
        }


        .c6-coming-card p {
          font-family: 'Fraunces', serif;

          font-size: 14px;

          line-height: 1.6;

          color: rgba(255,255,255,.65);

          margin: 0;
        }


        .c6-coming-stars {
          display: flex;
          justify-content: center;

          gap: 6px;

          margin-top: 24px;

          color: var(--c6-gold);
        }


        /* FLOATING CARD */

        .c6-coming-floating {
          position: absolute;

          right: -15px;
          bottom: 55px;

          z-index: 4;

          display: flex;
          align-items: center;

          gap: 10px;

          background: white;

          border: 1px solid var(--c6-line);

          border-radius: 12px;

          padding: 11px 14px;

          box-shadow:
            0 15px 35px rgba(6,11,22,.12);

          animation: c6-float 4s ease-in-out infinite;
        }


        @keyframes c6-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }


        .c6-floating-icon {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          color: var(--c6-gold);

          background: rgba(217,165,32,.1);
        }


        .c6-coming-floating strong {
          display: block;

          font-size: 10px;

          color: var(--c6-text);
        }


        .c6-coming-floating span {
          display: block;

          font-size: 9px;

          color: var(--c6-text-light);

          margin-top: 2px;
        }


        /* BOTTOM */

        .c6-coming-bottom {
          max-width: 1150px;

          margin: 50px auto 0;

          padding-top: 25px;

          border-top: 1px solid var(--c6-line);

          display: flex;
          align-items: center;

          gap: 35px;
        }


        .c6-coming-bottom-item {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 11px;
        }


        .c6-coming-bottom-item strong {
          color: var(--c6-gold);

          font-family: 'Fraunces', serif;

          font-size: 16px;
        }


        .c6-coming-bottom-item span {
          color: var(--c6-text-light);
        }


        .c6-coming-bottom-title {
          margin-left: auto;

          font-family: 'Fraunces', serif;

          font-size: 14px;

          color: var(--c6-text-light);
        }


        .c6-coming-bottom-title b {
          color: var(--c6-red);
        }


        /* TABLET */

        @media (max-width: 850px) {

          .c6-coming-hero {
            grid-template-columns: 1fr;

            text-align: center;

            gap: 30px;
          }

          .c6-coming-description {
            margin-left: auto;
            margin-right: auto;
          }

          .c6-coming-actions {
            justify-content: center;
          }

          .c6-coming-note {
            justify-content: center;
          }

          .c6-coming-visual {
            min-height: 470px;
          }

          .c6-coming-bottom {
            justify-content: center;
            flex-wrap: wrap;
          }

          .c6-coming-bottom-title {
            width: 100%;
            margin: 10px 0 0;
            text-align: center;
          }
        }


        /* MOBILE */

        @media (max-width: 500px) {

          .c6-coming-page {
            padding: 25px 15px 50px;
          }

          .c6-coming-top {
            margin-bottom: 35px;
          }

          .c6-coming-content h1 {
            font-size: 45px;
            letter-spacing: -1.5px;
          }

          .c6-coming-description {
            font-size: 13px;
          }

          .c6-coming-visual {
            min-height: 420px;
          }

          .c6-coming-card {
            width: 275px;
            min-height: 370px;

            padding: 30px 25px;
          }

          .c6-coming-card h2 {
            font-size: 42px;
          }

          .circle-one {
            width: 330px;
            height: 330px;
          }

          .circle-two {
            width: 275px;
            height: 275px;
          }

          .c6-coming-floating {
            right: 0;
            bottom: 20px;
          }

          .c6-coming-bottom {
            gap: 20px;
          }
        }

      `}</style>
    </>
  );
};

export default ComingSoon;