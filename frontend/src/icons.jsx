// Small hand-rolled Feather-style icon set (24x24, stroke = currentColor).
// No icon library dependency — consistent with charts.jsx's inline-SVG approach.

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Svg = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} {...base} {...rest}>{children}</svg>
);

export const AnchorIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="5" r="2.2" />
    <path d="M12 7.2V21M5 12H2a10 10 0 0 0 20 0h-3M7 16l-2 2M17 16l2 2" />
  </Svg>
);

export const ShipIcon = (props) => (
  <Svg {...props}>
    <path d="M4 14.5 5.2 19a1 1 0 0 0 1 .8h11.6a1 1 0 0 0 1-.8l1.2-4.5" />
    <path d="M6 14.5 7 7.7a1 1 0 0 1 1-.9h8a1 1 0 0 1 1 .9l1 6.8" />
    <path d="M12 6.8V3.5M9.7 3.5h4.6" />
  </Svg>
);

export const RouteIcon = (props) => (
  <Svg {...props}>
    <circle cx="5" cy="18" r="2.2" />
    <circle cx="19" cy="6" r="2.2" />
    <path d="M6.8 16.5 17.2 7.5" strokeDasharray="2.5 2.5" />
  </Svg>
);

export const PackageIcon = (props) => (
  <Svg {...props}>
    <path d="M21 8.5v7L12 20l-9-4.5v-7L12 4l9 4.5Z" />
    <path d="M3.3 8 12 12l8.7-4M12 12v8.3" />
  </Svg>
);

export const GaugeIcon = (props) => (
  <Svg {...props}>
    <path d="M4 14a8 8 0 1 1 16 0" />
    <path d="M12 14 15.2 9.5" />
    <path d="M4 14h1M19 14h1M12 4v1" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7M18.5 7 18 19.2c0 .5-.5.8-1 .8H7c-.5 0-1-.3-1-.8L5.5 7" />
    <path d="M10 11v5M14 11v5" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Svg>
);

export const LogOutIcon = (props) => (
  <Svg {...props}>
    <path d="M15 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9" />
    <path d="M10 12h11M17 8l4 4-4 4" />
  </Svg>
);

export const AlertTriangleIcon = (props) => (
  <Svg {...props}>
    <path d="M10.6 3.9 2.2 18.5a1 1 0 0 0 .9 1.5h17.8a1 1 0 0 0 .9-1.5L13.4 3.9a1 1 0 0 0-1.7 0Z" />
    <path d="M12 9.5v4.2M12 16.7h.01" />
  </Svg>
);

export const ChevronLeftIcon = (props) => (
  <Svg {...props}><path d="M14.5 5 8 12l6.5 7" /></Svg>
);

export const ChevronRightIcon = (props) => (
  <Svg {...props}><path d="M9.5 5 16 12l-6.5 7" /></Svg>
);

// A larger decorative sailing-ship illustration for the login page — hand-drawn
// pencil-sketch character via an SVG filter (feTurbulence + feDisplacementMap
// wobbles otherwise-clean paths into a sketchy line), not a raster asset, so it
// stays a tiny inline component consistent with the rest of this file.
export function ShipSketch({ className, id = "sketchWobble" }) {
  return (
    <svg viewBox="0 0 340 260" className={className} fill="none" aria-hidden="true">
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.014" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* mast */}
        <path d="M170 210 170 46" strokeWidth="3" />
        {/* main sail (right of mast) */}
        <path d="M174 58 174 186 Q222 150 222 112 Q200 76 174 58Z" strokeWidth="2.2" />
        {/* jib sail (left of mast) */}
        <path d="M166 70 166 174 Q126 148 118 116 Q140 88 166 70Z" strokeWidth="2.2" />
        {/* pennant */}
        <path d="M170 46 198 52 170 58Z" strokeWidth="1.8" opacity=".9" />
        {/* hull */}
        <path d="M52 198 Q170 236 288 198 Q254 220 170 220 Q86 220 52 198Z" strokeWidth="3" />
        <path d="M70 200 270 200" strokeWidth="1.6" opacity=".7" />
        {/* waterline waves */}
        <path d="M10 226 Q40 214 70 226 T130 226 T190 226 T250 226 T310 226" strokeWidth="2" opacity=".6" />
        <path d="M0 244 Q32 233 64 244 T128 244 T192 244 T256 244 T320 244" strokeWidth="1.6" opacity=".4" />
      </g>
    </svg>
  );
}
