// Small hand-rolled, dependency-free chart primitives for the Dashboard tab.
// Colors are passed in by the caller (see DashboardView.jsx) so this file stays
// a generic presentational layer, not a place where category->color mapping lives.
import { useEffect, useRef, useState } from "react";

// requestAnimationFrame count-up: ticks from the previous value to the new one
// whenever `value` changes (mount included), so a live poll update animates
// instead of popping.
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (from === to) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

// A tiny live-history line — real polled values (DashboardView keeps the last
// ~20 samples), not decoration, so it only ever shows genuine movement.
export function Sparkline({ points, color = "var(--status-blue)", width = 60, height = 22 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatTile({ label, value, icon, decimals = 0, trend }) {
  const n = typeof value === "number" ? value : Number(value) || 0;
  const animated = useCountUp(n);
  const text = typeof value === "number"
    ? animated.toLocaleString(undefined, { maximumFractionDigits: decimals })
    : value; // non-numeric values (already-formatted strings) render as-is
  return (
    <div className="stat-tile">
      <div className="stat-top">
        {icon && <div className="stat-icon">{icon}</div>}
        <Sparkline points={trend} />
      </div>
      <div className="stat-value">{text}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function LiveDot({ label = "Live" }) {
  return (
    <span className="live-dot">
      <span className="live-dot-ping" />
      {label}
    </span>
  );
}

const ROW_HEIGHT = 24;
const BAR_HEIGHT = 13;
const RADIUS = 4;
const LABEL_COL = 84; // fixed-width category label column, left of the bars
const VALUE_GUTTER = 28; // room for the value label at the bar's tip

// A single horizontal bar with a rounded data-end and a square baseline edge
// (marks-and-anatomy: "4px rounded data-end, square at the baseline"). Width
// transitions via CSS (see .bar-rect in styles.css) so a mount or a live data
// update sweeps the bar to its new length instead of jumping.
function Bar({ x, y, width, fill }) {
  const r = Math.min(RADIUS, width);
  return (
    <g>
      <rect x={x} y={y} width={width} height={BAR_HEIGHT} rx={r} ry={r} fill={fill} className="bar-rect" />
      {width > r && <rect x={x} y={y} width={r} height={BAR_HEIGHT} fill={fill} className="bar-rect" />}
    </g>
  );
}

// Horizontal bar chart for a small categorical breakdown (3-6 rows). Each row
// carries its own text label, so it doubles as the identity channel — no
// separate legend box is needed the way it would be for a stacked/multi-line chart.
export function BarChart({ title, data, width = 320 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.value));
  const plotWidth = width - LABEL_COL - VALUE_GUTTER;
  const height = data.length * ROW_HEIGHT;

  return (
    <div className="barchart">
      <h3>{title}</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}
      >
        {data.map((d, i) => {
          const y = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
          const targetWidth = (d.value / max) * plotWidth;
          const barWidth = mounted ? Math.max(targetWidth, 2) : 0;
          return (
            <g key={d.label} className="chart-row" style={{ "--i": i }}>
              <title>{`${d.label}: ${d.value}`}</title>
              <text x={0} y={y + BAR_HEIGHT / 2} dominantBaseline="middle" className="chart-cat">
                {d.label}
              </text>
              <line
                x1={LABEL_COL} y1={y + BAR_HEIGHT} x2={LABEL_COL + plotWidth} y2={y + BAR_HEIGHT}
                className="chart-baseline"
              />
              <Bar x={LABEL_COL} y={y} width={barWidth} fill={d.color} />
              <text
                x={LABEL_COL + barWidth + 8}
                y={y + BAR_HEIGHT / 2}
                dominantBaseline="middle"
                className="chart-value"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Ring composition chart — each category is a stroked-circle arc, swept in on
// mount/update (dasharray/dashoffset transition), with a live count-up total
// in the center and a legend underneath (identity channel per the "legend for
// >= 2 series" rule — a donut has no room for direct in-arc labels).
export function DonutChart({ title, data, size = 168, strokeWidth = 22 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const animatedTotal = useCountUp(total);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const safeTotal = Math.max(1, total);

  let acc = 0;
  const segs = data.map((d) => {
    const len = (d.value / safeTotal) * c;
    const offset = -acc;
    acc += len;
    return { ...d, len, offset };
  });

  return (
    <div className="barchart donut">
      <h3>{title}</h3>
      <div className="donut-body">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={strokeWidth} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segs.map((d) => (
              <circle
                key={d.label}
                className="donut-seg"
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={strokeWidth}
                strokeDasharray={mounted ? `${d.len} ${c - d.len}` : `0 ${c}`}
                strokeDashoffset={mounted ? d.offset : 0}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="donut-center">
          <div className="donut-total">{Math.round(animatedTotal)}</div>
          <div className="donut-total-label">Total</div>
        </div>
      </div>
      <ul className="donut-legend">
        {data.map((d) => (
          <li key={d.label}>
            <span className="dot" style={{ background: d.color }} />
            {d.label}
            <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Radial gauge — a single live percentage (e.g. "share of fleet active"), arc
// sweeps to its value on mount and re-sweeps smoothly whenever the value
// changes on a live poll.
export function RadialGauge({ label, value, max, color = "var(--status-blue)", size = 120, strokeWidth = 12 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const len = mounted ? pct * c : 0;
  const animatedPct = useCountUp(Math.round(pct * 100));

  return (
    <div className="gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={strokeWidth} />
        <circle
          className="gauge-arc"
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${len} ${c - len}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="gauge-value">
          {Math.round(animatedPct)}%
        </text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
}
