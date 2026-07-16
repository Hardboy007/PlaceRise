import { useState } from "react";

const COLOR_POOL = [
  "#3B82F6",
  "#0EA5E9",
  "#F59E0B",
  "#6366F1",
  "#EF4444",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

// Reusable company logo — tries Google's favicon service off the
// company's website URL, falls back to a colored initial tile if the
// website is missing or the favicon fails to load. `seed` (e.g. company
// name or index) picks a consistent fallback color per company.
export default function CompanyLogo({ name, website, size = 48, seed = 0 }) {
  const [error, setError] = useState(false);
  const displayName = name || "Company";
  const initial = displayName.charAt(0).toUpperCase();
  const colorIndex =
    typeof seed === "number"
      ? seed
      : displayName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = COLOR_POOL[colorIndex % COLOR_POOL.length];
  const logoUrl = website
    ? `https://www.google.com/s2/favicons?domain=${website}&sz=64`
    : null;

  const px = `${size}px`;

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={displayName}
        onError={() => setError(true)}
        style={{ width: px, height: px }}
        className="rounded-xl object-contain bg-white border border-[#E2E8F0] p-1.5 shrink-0"
      />
    );
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
      className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
    >
      {initial}
    </div>
  );
}
