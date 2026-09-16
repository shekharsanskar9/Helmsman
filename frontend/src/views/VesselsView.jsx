import { useState } from "react";
import { listVessels, createVessel, deleteVessel } from "../api";
import { usePagedList } from "../hooks";
import { Pagination, StatusBadge } from "../components";
import { useAuth } from "../auth";
import { validateVessel } from "../validation";
import { PlusIcon, SearchIcon, TrashIcon } from "../icons";

const TYPES = ["Container", "Bulk Carrier", "Tanker", "Ro-Ro"];
const STATUSES = ["Active", "In Port", "Maintenance", "Retired"];
const EMPTY = {
  name: "", imo_number: "", vessel_type: "Container",
  status: "Active", capacity_tonnes: "", year_built: "",
};

export default function VesselsView() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const list = usePagedList(listVessels, { limit: 10 });
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");

  const fieldErrors = validateVessel(form);
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
      await createVessel({
        ...form,
        capacity_tonnes: form.capacity_tonnes ? Number(form.capacity_tonnes) : null,
        year_built: form.year_built ? Number(form.year_built) : null,
      });
      setForm(EMPTY);
      setTouched({});
      list.reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Retire this vessel? Its voyages and cargo will be removed too.")) return;
    try {
      await deleteVessel(id);
      list.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section>
      {isAdmin && (
        <form className="card add-form" onSubmit={handleAdd}>
          <h2>Add vessel</h2>
          <div className="grid">
            <div className="field-wrap">
              <input placeholder="Name" value={form.name} onChange={set("name")} />
              {fieldError("name") && <p className="field-error">{fieldError("name")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="IMO number" value={form.imo_number} onChange={set("imo_number")} />
              {fieldError("imo_number") && <p className="field-error">{fieldError("imo_number")}</p>}
            </div>
            <select value={form.vessel_type} onChange={set("vessel_type")}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="field-wrap">
              <input placeholder="Capacity (tonnes)" value={form.capacity_tonnes} onChange={set("capacity_tonnes")} />
              {fieldError("capacity_tonnes") && <p className="field-error">{fieldError("capacity_tonnes")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Year built" value={form.year_built} onChange={set("year_built")} />
              {fieldError("year_built") && <p className="field-error">{fieldError("year_built")}</p>}
            </div>
          </div>
          {formError && <p className="error">⚠ {formError}</p>}
          <button type="submit" disabled={Object.keys(fieldErrors).length > 0}><PlusIcon size={14} /> Add to fleet</button>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <input
            placeholder="Search by name…"
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
                  <th>Name</th><th>IMO</th><th>Type</th><th>Status</th>
                  <th>Capacity (t)</th><th>Built</th><th></th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.imo_number}</td>
                    <td>{v.vessel_type}</td>
                    <td><StatusBadge value={v.status} /></td>
                    <td>{v.capacity_tonnes ?? "—"}</td>
                    <td>{v.year_built ?? "—"}</td>
                    <td>{isAdmin && <button className="danger" onClick={() => handleDelete(v.id)}><TrashIcon size={13} /> Retire</button>}</td>
                  </tr>
                ))}
                {list.items.length === 0 && (
                  <tr><td colSpan="7" className="muted">No vessels found.</td></tr>
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
