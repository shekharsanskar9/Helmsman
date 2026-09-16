// Small shared UI pieces used across the resource views.
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function Pagination({ skip, limit, total, onGoto, loading }) {
  const page = Math.floor(skip / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + limit, total);
  return (
    <div className="pagination">
      <span className="muted">
        {from}–{to} of {total}
      </span>
      <div className="pager">
        <button
          disabled={loading || skip === 0}
          onClick={() => onGoto(Math.max(0, skip - limit))}
        >
          <ChevronLeftIcon size={14} /> Prev
        </button>
        <span className="page-ind">
          Page {page} / {pages}
        </span>
        <button
          disabled={loading || skip + limit >= total}
          onClick={() => onGoto(skip + limit)}
        >
          Next <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}

// Maps a status/label string to a badge class (e.g. "In Transit" -> "intransit").
export function StatusBadge({ value }) {
  const cls = String(value).replace(/\s/g, "").toLowerCase();
  return <span className={`badge ${cls}`}>{value}</span>;
}
