import { useEffect, useState } from "react";
import { listCargo, createCargo, deleteCargo, listVoyages } from "../api";
import { usePagedList } from "../hooks";
import { Pagination } from "../components";
import { useAuth } from "../auth";
import { validateCargo } from "../validation";
import { PlusIcon, SearchIcon, TrashIcon, AlertTriangleIcon } from "../icons";

const TYPES = ["Container", "Dry Bulk", "Liquid Bulk", "Refrigerated", "Vehicles"];
const EMPTY = {
  voyage_id: "", description: "", cargo_type: "Container",
  weight_tonnes: "", quantity: "", hazardous: false,
};

export default function CargoView() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const list = usePagedList(listCargo, { limit: 10 });
  const [voyages, setVoyages] = useState([]); // for the voyage FK dropdown
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [search, setSearch] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    listVoyages({ limit: 100 })
      .then((d) => setVoyages(d.items))
      .catch(() => setVoyages([]));
  }, []);

  const fieldErrors = validateCargo(form);
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const fieldError = (k) => touched[k] && fieldErrors[k];
  const applySearch = () => list.applyFilters({ search, cargo_type: cargoType });

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    try {
      await createCargo({
        voyage_id: Number(form.voyage_id),
        description: form.description,
        cargo_type: form.cargo_type,
        weight_tonnes: form.weight_tonnes ? Number(form.weight_tonnes) : null,
        quantity: form.quantity ? Number(form.quantity) : null,
        hazardous: !!form.hazardous,
      });
      setForm(EMPTY);
      setTouched({});
      list.reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this cargo record?")) return;
    try {
      await deleteCargo(id);
      list.reload();
    } catch (err) {
      alert(err.message);
    }
  }

  const voyageLabel = (vy) =>
    vy ? `${vy.voyage_number} (${vy.origin_port} → ${vy.destination_port})` : "—";

  return (
    <section>
      {isAdmin && (
        <form className="card add-form" onSubmit={handleAdd}>
          <h2>Add cargo</h2>
          <div className="grid">
            <div className="field-wrap">
              <select value={form.voyage_id} onChange={set("voyage_id")}>
                <option value="">— Voyage —</option>
                {voyages.map((vy) => (
                  <option key={vy.id} value={vy.id}>
                    {vy.voyage_number} · {vy.origin_port}→{vy.destination_port}
                  </option>
                ))}
              </select>
              {fieldError("voyage_id") && <p className="field-error">{fieldError("voyage_id")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Description" value={form.description} onChange={set("description")} />
              {fieldError("description") && <p className="field-error">{fieldError("description")}</p>}
            </div>
            <select value={form.cargo_type} onChange={set("cargo_type")}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="field-wrap">
              <input placeholder="Weight (tonnes)" value={form.weight_tonnes} onChange={set("weight_tonnes")} />
              {fieldError("weight_tonnes") && <p className="field-error">{fieldError("weight_tonnes")}</p>}
            </div>
            <div className="field-wrap">
              <input placeholder="Quantity / units" value={form.quantity} onChange={set("quantity")} />
              {fieldError("quantity") && <p className="field-error">{fieldError("quantity")}</p>}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={form.hazardous}
                onChange={(e) => setForm({ ...form, hazardous: e.target.checked })}
              />
              Hazardous
            </label>
          </div>
          {formError && <p className="error">⚠ {formError}</p>}
          <button type="submit" disabled={Object.keys(fieldErrors).length > 0}><PlusIcon size={14} /> Add cargo</button>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <input
            placeholder="Search description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
          <select
            value={cargoType}
            onChange={(e) => {
              const t = e.target.value;
              setCargoType(t);
              list.applyFilters({ search, cargo_type: t });
            }}
          >
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                  <th>Description</th><th>Type</th><th>Voyage</th>
                  <th>Weight (t)</th><th>Qty</th><th>Hazardous</th><th></th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.description}</td>
                    <td>{c.cargo_type}</td>
                    <td>{voyageLabel(c.voyage)}</td>
                    <td>{c.weight_tonnes ?? "—"}</td>
                    <td>{c.quantity ?? "—"}</td>
                    <td>{c.hazardous ? <span className="badge hazardous"><AlertTriangleIcon size={11} /> Hazardous</span> : "—"}</td>
                    <td>{isAdmin && <button className="danger" onClick={() => handleDelete(c.id)}><TrashIcon size={13} /> Remove</button>}</td>
                  </tr>
                ))}
                {list.items.length === 0 && (
                  <tr><td colSpan="7" className="muted">No cargo found.</td></tr>
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
