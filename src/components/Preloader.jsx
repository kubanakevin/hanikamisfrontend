// src/components/Preloader.jsx
import { useState, useEffect } from "react";
import Iconimage from "../assets/icon.png";

const Preloader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let startTime = Date.now();
    const duration = 800; // 800ms preloader duration

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min((elapsed / duration) * 100, 95);
      setProgress(progressValue);

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      // Clean up
    };
  }, []);

  return (
    <div className="preloader">
      <div className="preloader-container">
        {/* Logo with rotating ring */}
        <div className="preloader-mark">
          <svg className="preloader-ring" viewBox="0 0 100 100" width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--haip-light-bg)"
              strokeWidth="2.5"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--haip-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="70 207"
              className="preloader-ring__arc"
            />
          </svg>
          <img src={Iconimage} alt="HAIP" className="preloader-logo" />
        </div>

        {/* Text panel with tinted background */}
        <div className="preloader-text-panel">
          <h1 className="preloader-title">HANIKA</h1>
          <p className="preloader-subtitle">Anglican Integrated Polytechnic</p>

          {/* Progress bar */}
          <div className="preloader-progress">
            <div
              className="preloader-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status text */}
          <p className="preloader-status">
            {progress < 30 && "Preparing..."}
            {progress >= 30 && progress < 60 && "Loading content..."}
            {progress >= 60 && progress < 90 && "Almost there..."}
            {progress >= 90 && "Ready"}
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --haip-primary: #893C87;
          --haip-dark: #6F2F6D;
          --haip-light: #B96AAE;
          --haip-light-bg: #F3EAF2;
          --white: #FFFFFF;
          --text-dark: #292329;
          --text-muted: #777277;
          --border: #E1D9E0;
        }

        .preloader {
          position: fixed;
          inset: 0;
          background: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .preloader-container {
          text-align: center;
          max-width: 360px;
          padding: 0 24px;
          animation: preloader-fade-in 0.35s ease;
        }

        @keyframes preloader-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Logo mark with rotating ring */
        .preloader-mark {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preloader-ring {
          position: absolute;
          inset: 0;
          transform: rotate(-90deg);
        }

        .preloader-ring__arc {
          animation: preloader-spin 1.1s linear infinite;
          transform-origin: 50px 50px;
        }

        @keyframes preloader-spin {
          to { transform: rotate(360deg); }
        }

        .preloader-logo {
          width: 56px;
          height: 56px;
          object-fit: contain;
          border-radius: 10px;
        }

        /* ---- Text panel with tinted background ---- */
        .preloader-text-panel {
          background: var(--haip-light-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 22px 24px 20px;
          box-shadow: 0 4px 20px rgba(137, 60, 135, 0.06);
        }

        .preloader-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 22px;
          color: var(--haip-dark);
          margin: 0 0 4px;
          letter-spacing: 0.2px;
        }

        .preloader-subtitle {
          font-size: 13px;
          color: var(--haip-primary);
          font-weight: 500;
          margin: 0 0 20px;
          opacity: 0.85;
        }

        /* Progress bar sits inside the panel now */
        .preloader-progress {
          width: 100%;
          height: 4px;
          background: #FFFFFF;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .preloader-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--haip-dark), var(--haip-primary));
          border-radius: 4px;
          transition: width 0.15s ease-out;
        }

        .preloader-status {
          font-size: 12px;
          color: var(--haip-primary);
          font-weight: 600;
          margin: 0;
          min-height: 16px;
          letter-spacing: 0.2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .preloader-ring__arc { animation: none; }
          .preloader-container { animation: none; }
        }

        @media (max-width: 480px) {
          .preloader-mark {
            width: 84px;
            height: 84px;
          }
          .preloader-logo {
            width: 48px;
            height: 48px;
          }
          .preloader-title {
            font-size: 19px;
          }
          .preloader-text-panel {
            padding: 18px 18px 16px;
            border-radius: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Preloader;