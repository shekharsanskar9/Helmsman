import { useState } from "react";
import { useAuth } from "../auth";
import { AnchorIcon, ShipIcon, RouteIcon, PackageIcon, GaugeIcon, ShipSketch } from "../icons";

const EMPTY = { email: "", password: "" };

const FEATURES = [
  { Icon: ShipIcon, label: "Fleet tracking" },
  { Icon: RouteIcon, label: "Voyage scheduling" },
  { Icon: PackageIcon, label: "Cargo manifests" },
  { Icon: GaugeIcon, label: "Live dashboard" },
];

export default function LoginView() {
  const auth = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await auth.login(form.email, form.password);
      } else {
        await auth.register(form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  }

  return (
    <div className="login-screen">
      <div className="login-intro">
        <div className="sonar" aria-hidden="true">
          <div className="sonar-sweep" />
          <div className="sonar-ring r1" />
          <div className="sonar-ring r2" />
          <div className="sonar-ring r3" />
          <div className="sonar-ping" />
          <div className="sonar-ping delay" />
          <ShipSketch className="sonar-ship" />
        </div>
        <div className="login-intro-content">
          <div className="login-wordmark"><AnchorIcon size={40} /> <span className="brand-text hero">Helmsman</span></div>
          <p className="login-tagline">Fleet management for maritime operators</p>
          <p className="login-desc">
            Track vessels, the voyages they run, and the cargo they carry — in one
            place. Search, filter, and role-based access for admins and viewers.
          </p>
          <ul className="login-features">
            {FEATURES.map(({ Icon, label }) => (
              <li key={label}>
                <span className="icon-box"><Icon size={16} /></span>
                {label}
              </li>
            ))}
          </ul>
          <div className="login-hint">
            Try it: <b>admin@helmsman.local</b> / <b>ChangeMe123!</b>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-wrap">
          <form className="card login-card" onSubmit={handleSubmit}>
            <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
            <div className="grid">
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={set("email")}
              />
              <input
                required
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={set("password")}
              />
            </div>
            {error && <p className="error">⚠ {error}</p>}
            <button type="submit" disabled={submitting}>
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
            <p className="muted login-toggle">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button type="button" className="link-btn" onClick={toggleMode}>
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
