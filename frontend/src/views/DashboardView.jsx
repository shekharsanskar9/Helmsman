import { useEffect, useState } from "react";
import { getStats } from "../api";
import { StatTile, BarChart, DonutChart, RadialGauge, LiveDot } from "../charts";
import { ShipIcon, RouteIcon, PackageIcon, AlertTriangleIcon } from "../icons";

// Canonical category order + color per status, matching this app's existing
// badge colors (styles.css) so a status means the same color everywhere —
// the badge in a table row and the bar/donut slice in these charts are the
// same entity.
// Dark-surface-appropriate steps (the app runs a dark theme).
const VESSEL_STATUSES = [
  { label: "Active", color: "#22c55e" },
  { label: "In Port", color: "#3b82f6" },
  { label: "Maintenance", color: "#f59e0b" },
  { label: "Retired", color: "#9ca3af" },
];
const VOYAGE_STATUSES = [
  { label: "Planned", color: "#64748b" },
  { label: "In Transit", color: "#3b82f6" },
  { label: "Completed", color: "#22c55e" },
  { label: "Cancelled", color: "#9ca3af" },
];
// True categorical identities (no inherent status/severity) — fixed hue order
// from the dataviz categorical palette, dark-surface steps (slots 1-5).
const CARGO_TYPES = [
  { label: "Container", color: "#3987e5" },
  { label: "Dry Bulk", color: "#d95926" },
  { label: "Liquid Bulk", color: "#199e70" },
  { label: "Refrigerated", color: "#c98500" },
  { label: "Vehicles", color: "#d55181" },
];

const POLL_MS = 15000;
const HISTORY_LEN = 20;

function withCounts(canonical, counts) {
  return canonical.map((c) => ({ ...c, value: counts[c.label] ?? 0 }));
}

function pushHistory(arr, value) {
  return [...arr, value].slice(-HISTORY_LEN);
}

export default function DashboardView() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  // Real polled samples (not fabricated) feeding each StatTile's sparkline —
  // starts empty and builds up a genuine live history over the session.
  const [history, setHistory] = useState({ vessels: [], transit: [], weight: [], hazardous: [] });

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getStats()
        .then((d) => {
          if (cancelled) return;
          setStats(d);
          setHistory((h) => ({
            vessels: pushHistory(h.vessels, d.vessels.total),
            transit: pushHistory(h.transit, d.voyages.by_status["In Transit"] ?? 0),
            weight: pushHistory(h.weight, d.cargo.total_weight_tonnes),
            hazardous: pushHistory(h.hazardous, d.cargo.hazardous_count),
          }));
        })
        .catch((e) => !cancelled && setError(e.message));
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (error) return <p className="error">⚠ {error}</p>;
  if (!stats) return <p className="muted">Loading…</p>;

  const activePct = stats.vessels.total > 0 ? (stats.vessels.by_status["Active"] ?? 0) / stats.vessels.total * 100 : 0;
  const hazardousPct = stats.cargo.total > 0 ? stats.cargo.hazardous_count / stats.cargo.total * 100 : 0;

  return (
    <section>
      <div className="card">
        <div className="dashboard-head">
          <h3 style={{ margin: 0 }}>Fleet overview</h3>
          <LiveDot />
        </div>
        <div className="stats-grid">
          <StatTile icon={<ShipIcon size={18} />} label="Total vessels" value={stats.vessels.total} trend={history.vessels} />
          <StatTile icon={<RouteIcon size={18} />} label="Voyages in transit" value={stats.voyages.by_status["In Transit"] ?? 0} trend={history.transit} />
          <StatTile icon={<PackageIcon size={18} />} label="Total cargo weight (t)" value={stats.cargo.total_weight_tonnes} trend={history.weight} />
          <StatTile icon={<AlertTriangleIcon size={18} />} label="Hazardous cargo items" value={stats.cargo.hazardous_count} trend={history.hazardous} />
        </div>
      </div>

      <div className="card">
        <div className="gauge-row">
          <RadialGauge label="Fleet active" value={stats.vessels.by_status["Active"] ?? 0} max={stats.vessels.total} color="var(--status-green)" />
          <RadialGauge label="Cargo hazardous" value={stats.cargo.hazardous_count} max={stats.cargo.total} color="var(--status-orange)" />
        </div>
      </div>

      <div className="chart-grid chart-grid-equal">
        <div className="card">
          <DonutChart title="Fleet composition" data={withCounts(VESSEL_STATUSES, stats.vessels.by_status)} />
        </div>
        <div className="card">
          <BarChart title="Vessels by status" data={withCounts(VESSEL_STATUSES, stats.vessels.by_status)} />
        </div>
        <div className="card">
          <BarChart title="Voyages by status" data={withCounts(VOYAGE_STATUSES, stats.voyages.by_status)} />
        </div>
        <div className="card">
          <BarChart title="Cargo by type" data={withCounts(CARGO_TYPES, stats.cargo.by_type)} />
        </div>
      </div>
    </section>
  );
}
