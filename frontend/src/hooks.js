import { useEffect, useState } from "react";

/**
 * Encapsulates the list + search/filter + pagination pattern shared by every
 * resource view. `fetcher` must be a stable function (a module-level api.js
 * export) that accepts { skip, limit, ...filters } and returns { items, total }.
 */
export function usePagedList(fetcher, { limit = 10, initialFilters = {} } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0); // manual reload trigger (after create/delete)

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetcher({ skip, limit, ...filters })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, skip, limit, filters, tick]);

  // Applying filters resets to the first page.
  const applyFilters = (next) => {
    setSkip(0);
    setFilters(next);
  };
  const goto = (nextSkip) => setSkip(nextSkip);
  const reload = () => setTick((t) => t + 1);

  return { items, total, skip, limit, loading, error, filters, applyFilters, goto, reload };
}
