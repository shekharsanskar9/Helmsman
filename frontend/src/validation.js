// Pure per-field validators for the three "Add ___" forms. Each returns a
// { field: message } map of only the fields currently in error, so callers can
// render errors inline and gate submit on `Object.keys(errors).length === 0`.

const CURRENT_YEAR = new Date().getFullYear();

function numberInRange(value, min, max) {
  if (value === "" || value === null || value === undefined) return true; // optional
  const n = Number(value);
  return Number.isFinite(n) && n >= min && (max === undefined || n <= max);
}

export function validateVessel(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!/^\d{7}$/.test(form.imo_number.trim())) errors.imo_number = "IMO number must be exactly 7 digits.";
  if (!numberInRange(form.capacity_tonnes, 0)) errors.capacity_tonnes = "Must be 0 or more.";
  if (!numberInRange(form.year_built, 1900, CURRENT_YEAR + 1)) {
    errors.year_built = `Must be between 1900 and ${CURRENT_YEAR + 1}.`;
  }
  return errors;
}

export function validateVoyage(form) {
  const errors = {};
  if (!form.vessel_id) errors.vessel_id = "Select a vessel.";
  if (!form.voyage_number.trim()) errors.voyage_number = "Voyage number is required.";
  if (!form.origin_port.trim()) errors.origin_port = "Origin port is required.";
  if (!form.destination_port.trim()) errors.destination_port = "Destination port is required.";
  if (
    form.departure_date && form.arrival_date &&
    form.arrival_date < form.departure_date
  ) {
    errors.arrival_date = "Arrival must be on or after departure.";
  }
  return errors;
}

export function validateCargo(form) {
  const errors = {};
  if (!form.voyage_id) errors.voyage_id = "Select a voyage.";
  if (!form.description.trim()) errors.description = "Description is required.";
  if (!numberInRange(form.weight_tonnes, 0)) errors.weight_tonnes = "Must be 0 or more.";
  if (!numberInRange(form.quantity, 0)) errors.quantity = "Must be 0 or more.";
  return errors;
}
