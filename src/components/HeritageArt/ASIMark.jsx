/**
 * ASIMark — small SVG monogram used in the sidebar brand block and login
 * logo tile. Replaces the previous bare letter "A" that reviewers called
 * "too plain".
 *
 * Design: a stylized dome-and-plinth motif inside a rounded square,
 * evocative of Indian architecture without imitating any single monument.
 * Uses currentColor so the surrounding container controls the palette.
 */
export default function ASIMark({ size = 32, className, style, ...rest }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="ASI"
      {...rest}
    >
      {/* Rounded background tile is drawn by the parent container; this SVG
          only draws the emblem inside so tinting is easy. */}
      <g fill="currentColor">
        {/* Onion dome silhouette */}
        <path d="M 24 8 Q 12 12 12 24 L 12 30 L 36 30 L 36 24 Q 36 12 24 8 Z" />
        {/* Finial */}
        <rect x="23" y="4" width="2" height="6" rx="1" />
        <circle cx="24" cy="3" r="1.5" />
        {/* Plinth / base */}
        <path d="M 8 32 L 40 32 L 40 38 L 8 38 Z" />
        {/* Two flanking minaret dots */}
        <circle cx="8" cy="24" r="2.5" />
        <circle cx="40" cy="24" r="2.5" />
        {/* Ground line */}
        <path d="M 6 40 L 42 40 L 42 42 L 6 42 Z" opacity="0.5" />
      </g>
    </svg>
  );
}
