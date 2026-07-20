/**
 * Heritage-themed decorative SVG components.
 *
 * These are pure inline SVGs — no external assets, no image loading. They
 * inherit their fill color from `currentColor` so a parent can tint them
 * via CSS. Ships in the bundle, renders instantly, scales without loss.
 *
 * Two exports:
 *   - <MonumentSkyline /> : wide silhouette of iconic Indian heritage
 *     landmarks (temple gopuram, dome, minaret, stupa, chariot wheel,
 *     fort battlements). Meant to sit at the bottom of a hero panel.
 *
 *   - <HeritageMotif /> : compact single-motif ornament (mandala-like
 *     wheel). Meant to sit as a decorative accent on cards / headers.
 *
 * All shapes are stylized silhouettes — not architectural drawings — so
 * the whole ensemble reads cohesively rather than as a mashup of famous
 * monuments. Purpose is atmospheric, not literal.
 */

export function MonumentSkyline({ className, style, opacity = 1, ...rest }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      preserveAspectRatio="xMidYEnd meet"
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <g fill="currentColor" opacity={opacity}>
        {/* --- Rolling ground line so the whole thing rests on a base --- */}
        <path d="M0 195 L1200 195 L1200 200 L0 200 Z" />

        {/* --- 1. South Indian temple gopuram (leftmost, tallest, pyramidal) --- */}
        <g transform="translate(60, 60)">
          {/* Stepped pyramid tiers */}
          <path d="M 30 135 L 30 110 L 40 110 L 40 90 L 48 90 L 48 70 L 56 70 L 56 50 L 62 50 L 62 32 L 68 32 L 68 18 L 72 18 L 74 6 L 76 18 L 80 18 L 80 32 L 86 32 L 86 50 L 92 50 L 92 70 L 100 70 L 100 90 L 108 90 L 108 110 L 118 110 L 118 135 Z" />
          {/* Kalasha finial */}
          <circle cx="74" cy="4" r="3" />
          <path d="M 72 6 L 76 6 L 74 0 Z" />
          {/* Base plinth */}
          <path d="M 20 135 L 128 135 L 128 145 L 20 145 Z" />
        </g>

        {/* --- 2. Buddhist stupa with railings (short, hemispherical) --- */}
        <g transform="translate(220, 100)">
          {/* Hemisphere */}
          <path d="M 20 95 A 55 55 0 0 1 130 95 L 130 95 Z" />
          {/* Square platform on top (harmika) */}
          <path d="M 65 42 L 85 42 L 85 32 L 65 32 Z" />
          {/* Chattravali (umbrella stack) */}
          <path d="M 68 32 L 82 32 L 82 26 L 68 26 Z" />
          <path d="M 70 26 L 80 26 L 80 20 L 70 20 Z" />
          <path d="M 72 20 L 78 20 L 78 14 L 72 14 Z" />
          <rect x="74" y="6" width="2" height="8" />
          {/* Base */}
          <path d="M 10 95 L 140 95 L 140 105 L 10 105 Z" />
        </g>

        {/* --- 3. Central grand dome with flanking minarets (Taj-like) --- */}
        <g transform="translate(400, 20)">
          {/* Left minaret */}
          <rect x="10" y="60" width="8" height="115" />
          <path d="M 6 60 L 22 60 L 22 55 L 6 55 Z" />
          <path d="M 10 55 L 18 55 L 14 40 Z" />
          <circle cx="14" cy="38" r="2" />
          {/* Right minaret */}
          <rect x="222" y="60" width="8" height="115" />
          <path d="M 218 60 L 234 60 L 234 55 L 218 55 Z" />
          <path d="M 222 55 L 230 55 L 226 40 Z" />
          <circle cx="226" cy="38" r="2" />
          {/* Main platform */}
          <path d="M 30 130 L 210 130 L 210 175 L 30 175 Z" />
          {/* Iwan arch */}
          <path d="M 90 175 L 90 155 A 30 40 0 0 1 150 155 L 150 175 Z" fill="var(--color-surface, #fff)" opacity="0.15" />
          {/* Main onion dome */}
          <path d="M 60 130 Q 60 55 120 45 Q 180 55 180 130 Z" />
          {/* Dome finial base + spire */}
          <path d="M 114 45 L 126 45 L 126 40 L 114 40 Z" />
          <path d="M 116 40 L 124 40 L 120 24 Z" />
          <circle cx="120" cy="22" r="2.5" />
          {/* Small side domes */}
          <path d="M 40 130 Q 40 100 55 95 Q 70 100 70 130 Z" />
          <path d="M 170 130 Q 170 100 185 95 Q 200 100 200 130 Z" />
        </g>

        {/* --- 4. Qutub-Minar-like tapered tower (tall, cylindrical, fluted) --- */}
        <g transform="translate(700, 30)">
          {/* Balcony tiers from bottom up, tapered */}
          <path d="M 6 165 L 54 165 L 52 130 L 8 130 Z" />
          <path d="M 10 130 L 50 130 L 48 100 L 12 100 Z" />
          <path d="M 14 100 L 46 100 L 44 75 L 16 75 Z" />
          <path d="M 18 75 L 42 75 L 40 55 L 20 55 Z" />
          <path d="M 22 55 L 38 55 L 36 38 L 24 38 Z" />
          {/* Balcony overhangs */}
          <rect x="4" y="128" width="52" height="4" />
          <rect x="8" y="98"  width="44" height="4" />
          <rect x="12" y="73" width="36" height="4" />
          <rect x="16" y="53" width="28" height="4" />
          {/* Cap dome */}
          <path d="M 22 38 Q 22 22 30 20 Q 38 22 38 38 Z" />
          <rect x="28" y="10" width="4" height="12" />
        </g>

        {/* --- 5. Konark chariot wheel (Sun temple) --- */}
        <g transform="translate(800, 100)">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="8" />
          {/* 8 spokes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <rect x="49" y="8" width="2" height="34" />
            </g>
          ))}
          <path d="M 0 95 L 100 95 L 100 105 L 0 105 Z" />
        </g>

        {/* --- 6. Fort battlements / palace (rightmost, wide) --- */}
        <g transform="translate(940, 80)">
          {/* Main wall */}
          <path d="M 0 60 L 220 60 L 220 115 L 0 115 Z" />
          {/* Merlons (crenellations) */}
          <path d="M 0 60 L 10 60 L 10 45 L 22 45 L 22 60 L 34 60 L 34 45 L 46 45 L 46 60 L 58 60 L 58 45 L 70 45 L 70 60 L 82 60 L 82 45 L 94 45 L 94 60 L 106 60 L 106 45 L 118 45 L 118 60 L 130 60 L 130 45 L 142 45 L 142 60 L 154 60 L 154 45 L 166 45 L 166 60 L 178 60 L 178 45 L 190 45 L 190 60 L 202 60 L 202 45 L 214 45 L 214 60 L 220 60 L 220 40 L 0 40 Z" />
          {/* Central gateway arch */}
          <path d="M 92 115 L 92 90 Q 92 76 110 76 Q 128 76 128 90 L 128 115 Z" fill="var(--color-surface, #fff)" opacity="0.18" />
          {/* Tower on right */}
          <path d="M 200 40 L 220 40 L 220 20 L 200 20 Z" />
          <path d="M 198 20 L 222 20 L 222 12 L 198 12 Z" />
          <path d="M 205 12 L 215 12 L 210 2 Z" />
        </g>
      </g>
    </svg>
  );
}

/**
 * HeritageMotif — a mandala-esque wheel/rosette. Compact, single-color,
 * good as a corner decoration on hero cards.
 */
export function HeritageMotif({ className, style, size = 120, opacity = 1, ...rest }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={opacity}
        transform="translate(100 100)"
      >
        {/* Outer ring */}
        <circle r="90" />
        <circle r="70" />
        {/* 16-petal rosette */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0 -70 Q 8 -55 0 -40 Q -8 -55 0 -70 Z" fill="currentColor" opacity="0.4" />
            </g>
          );
        })}
        {/* Inner ring */}
        <circle r="30" />
        {/* Center 8-point star */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0 -28 L 4 -4 L 0 0 L -4 -4 Z" fill="currentColor" opacity="0.55" />
            </g>
          );
        })}
        <circle r="4" fill="currentColor" />
      </g>
    </svg>
  );
}
