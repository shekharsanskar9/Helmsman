import { useEffect, useState } from "react";
import { listVoyages, createVoyage, deleteVoyage, listVessels } from "../api";
import { usePagedList } from "../hooks";
import { Pagination, StatusBadge } from "../components";
import { useAuth } from "../auth";
import { validateVoyage } from "../validation";
import { PlusIcon, SearchIcon, TrashIcon } from "../icons";

const STATUSES = ["Planned", "In Transit", "Completed", "Cancelled"];
const EMPTY = {
  vessel_id: "", voyage_number: "", origin_port: "", destination_port: "",
  departure_date: "", arrival_date: "", status: "Planned",
};

export default function VoyagesView() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const list = usePagedList(listVoyages, { limit: 10 });
  const [vessels, setVessels] = useState([]); // for the vessel FK dropdown
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    listVessels({ limit: 100 })
      .then((d) => setVessels(d.items))
      .catch(() => setVessels([]));
  }, []);

  const fieldErrors = validateVoyage(form);
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const fieldError = (k) => touched[k] && fieldErrors[k];
  const applySearch = () => list.applyFilters({ search, status });

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    try {
      await createVoyage({
        ...form,
        vessel_id: Number(form.vessel_id),
        departure_date: form.departure_date || null,
        arrival_date: form.arrival_date || null,
      });
      setForm(EMPTY);
      setTouched({});
      list.reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this voyage? Its cargo will be removed too.")) return;
    try {
      await deleteVoyage(id);
      list.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section>
      {isAdmin && (
        <form className="card add-form" onSubmit={handleAdd}>
          <h2>Schedule voyage</h2>
          <div className="grid">
            <div className="field-wrap">
              <select value={form.vessel_id} onChange={set("vessel_id")}>
                <option value="">— Vessel —</option>
                {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {fieldError("vessel_id") && <p className="field-error">{fieldError("vessel_id")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Voyage number" value={form.voyage_number} onChange={set("voyage_number")} />
              {fieldError("voyage_number") && <p className="field-error">{fieldError("voyage_number")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Origin port" value={form.origin_port} onChange={set("origin_port")} />
              {fieldError("origin_port") && <p className="field-error">{fieldError("origin_port")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Destination port" value={form.destination_port} onChange={set("destination_port")} />
              {fieldError("destination_port") && <p className="field-error">{fieldError("destination_port")}</p>}
            </div>
            <label className="field"><span>Departure</span>
              <input type="date" value={form.departure_date} onChange={set("departure_date")} />
            </label>
            <div className="field-wrap">
              <label className="field"><span>Arrival</span>
                <input type="date" value={form.arrival_date} onChange={set("arrival_date")} />
              </label>
              {fieldError("arrival_date") && <p className="field-error">{fieldError("arrival_date")}</p>}
            </div>
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {formError && <p className="error">⚠ {formError}</p>}
          <button type="submit" disabled={Object.keys(fieldErrors).length > 0}><PlusIcon size={14} /> Add voyage</button>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <input
            placeholder="Search route or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
          <select
            value={status}
            onChange={(e) => {
              const s = e.target.value;
              setStatus(s);
              list.applyFilters({ search, status: s });
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applySearch}><SearchIcon size={14} /> Search</button>
        </div>

        {list.error && <p className="error">⚠ {list.error}</p>}
        {list.loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Voyage</th><th>Vessel</th><th>Route</th><th>Departs</th>
                  <th>Arrives</th><th>Status</th><th>Cargo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((v) => (
                  <tr key={v.id}>
                    <td>{v.voyage_number}</td>
                    <td>{v.vessel ? v.vessel.name : "—"}</td>
                    <td>{v.origin_port} → {v.destination_port}</td>
                    <td>{v.departure_date ?? "—"}</td>
                    <td>{v.arrival_date ?? "—"}</td>
                    <td><StatusBadge value={v.status} /></td>
                    <td>{v.cargo_count}</td>
                    <td>{isAdmin && <button className="danger" onClick={() => handleDelete(v.id)}><TrashIcon size={13} /> Delete</button>}</td>
                  </tr>
                ))}
                {list.items.length === 0 && (
                  <tr><td colSpan="8" className="muted">No voyages found.</td></tr>
                )}
              </tbody>
            </table>
            <Pagination skip={list.skip} limit={list.limit} total={list.total} onGoto={list.goto} loading={list.loading} />
          </>
        )}
      </div>
    </section>
  );
}
