import { useLayoutEffect, useRef, useState } from "react";
import DashboardView from "./views/DashboardView";
import VesselsView from "./views/VesselsView";
import VoyagesView from "./views/VoyagesView";
import CargoView from "./views/CargoView";
import LoginView from "./views/LoginView";
import { AuthProvider, useAuth } from "./auth";
import { AnchorIcon, GaugeIcon, ShipIcon, RouteIcon, PackageIcon, LogOutIcon } from "./icons";

const TABS = [
  { key: "dashboard", label: "Dashboard", Icon: GaugeIcon, Component: DashboardView },
  { key: "vessels", label: "Vessels", Icon: ShipIcon, Component: VesselsView },
  { key: "voyages", label: "Voyages", Icon: RouteIcon, Component: VoyagesView },
  { key: "cargo", label: "Cargo", Icon: PackageIcon, Component: CargoView },
];

const FOOTER_INFO = {
  name: "Sanskar Shekhar",
  email: "ssanskaraws@gmail.com",
  college: "BIT Mesra",
  branch: "CSE",
};

function AppShell() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const Active = TABS.find((t) => t.key === tab).Component;

  // A sliding underline that glides to the active tab instead of snapping,
  // measured off the actual button so it tracks each label's real width.
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div className="wrap">
      <header>
        <div className="session">
          <span>{user.email}</span>
          <span className="role">{user.role}</span>
          <button onClick={logout}><LogOutIcon size={14} /> Log out</button>
        </div>
        <h1><AnchorIcon size={44} /> <span className="brand-text">Helmsman</span></h1>
        <p>Fleet Management Dashboard</p>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              ref={(el) => { tabRefs.current[t.key] = el; }}
              className={`tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <t.Icon size={15} /> {t.label}
            </button>
          ))}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </nav>
      </header>
      <div className="tab-panel" key={tab}>
        <Active />
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <span>{FOOTER_INFO.name}</span>
      <span className="dot">·</span>
      <a href={`mailto:${FOOTER_INFO.email}`}>{FOOTER_INFO.email}</a>
      <span className="dot">·</span>
      <span>{FOOTER_INFO.college}</span>
      <span className="dot">·</span>
      <span>{FOOTER_INFO.branch}</span>
    </footer>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AppShell /> : <LoginView />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
