import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "404 — Page Not Found · PlaceRise";
  }, []);

  const getHomeRoute = () => {
    if (location.pathname.startsWith("/coordinator"))
      return "/coordinator/dashboard";
    if (location.pathname.startsWith("/student")) return "/student/dashboard";
    return "/";
  };

  const getHomeLabel = () => {
    if (location.pathname.startsWith("/coordinator"))
      return "Back to Dashboard";
    if (location.pathname.startsWith("/student")) return "Back to Dashboard";
    return "Back to Home";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F1F5F9",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.06); }
        }
        .btn-ghost:hover {
          background: #E2E8F0 !important;
          color: #0F172A !important;
        }
        .btn-primary:hover {
          opacity: 0.88 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 24px rgba(26,58,143,0.3) !important;
        }
        .btn-primary, .btn-ghost {
          transition: all 0.18s ease;
        }
      `}</style>

      {/* Blob top-left */}
      <div
        style={{
          position: "absolute",
          top: "-140px",
          left: "-140px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(26,58,143,0.07) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {/* Blob bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-100px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(26,58,143,0.05) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {/* Floating shapes */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "6%",
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          border: "2px solid rgba(26,58,143,0.1)",
          background: "rgba(26,58,143,0.03)",
          animation: "floatA 7s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "8%",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "2px solid rgba(26,58,143,0.1)",
          background: "rgba(26,58,143,0.03)",
          animation: "floatB 9s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "9%",
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: "rgba(26,58,143,0.06)",
          animation: "floatB 8s ease-in-out infinite 1s",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          right: "7%",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "2px solid rgba(26,58,143,0.08)",
          animation: "floatA 10s ease-in-out infinite 0.5s",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.65s ease, transform 0.65s ease",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/icons/icon-192.png"
              alt="Logo"
              style={{ 
                width: "34px", 
                height: "34px", 
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                border: "1px solid #E2E8F0",
                backgroundColor: "#fff",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#0F172A" }}>Place</span>
            <span style={{ color: "#1a3a8f" }}>Rise</span>
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "28px",
            padding: "48px 40px 44px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
            boxShadow:
              "0 4px 32px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top stripe */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              backgroundColor: "#1a3a8f",
            }}
          />

          {/* 404 */}
          <div style={{ textAlign: "center", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: "-16px",
                background:
                  "radial-gradient(ellipse, rgba(26,58,143,0.06) 0%, transparent 70%)",
                animation: "pulseGlow 4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "clamp(84px, 22vw, 124px)",
                fontWeight: 700,
                lineHeight: 1,
                color: "#1a3a8f",
                letterSpacing: "-5px",
                userSelect: "none",
                position: "relative",
              }}
            >
              404
            </div>
            <div
              style={{
                height: "3px",
                width: "64px",
                margin: "10px auto 0",
                borderRadius: "999px",
                backgroundColor: "#1a3a8f",
                opacity: 0.25,
              }}
            />
          </div>

          {/* Icon box */}
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="26"
              height="26"
              fill="none"
              stroke="#1a3a8f"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Text */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h1
              style={{
                color: "#0F172A",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Page not found
            </h1>
            <p
              style={{
                color: "#64748B",
                fontSize: "14px",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              The page you're looking for doesn't exist,
              <br />
              has been moved, or you don't have access.
            </p>

            {/* URL chip */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "5px 12px",
                  maxWidth: "300px",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <code
                  style={{
                    color: "#1a3a8f",
                    fontSize: "11.5px",
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "240px",
                    display: "block",
                  }}
                >
                  {location.pathname}
                </code>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0" }}
          />

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-ghost"
              onClick={() => window.history.back()}
              style={{
                flex: 1,
                minWidth: "130px",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F1F5F9",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>

            <button
              className="btn-primary"
              onClick={() => (window.location.href = getHomeRoute())}
              style={{
                flex: 1,
                minWidth: "130px",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: "#1a3a8f",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 16px rgba(26,58,143,0.22)",
              }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="white"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {getHomeLabel()}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            color: "#64748B",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          If you think this is a mistake, contact your placement coordinator.
        </p>
      </div>
    </div>
  );
}
