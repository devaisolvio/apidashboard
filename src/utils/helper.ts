import type { OpenRouterData } from "../App";

// Accepts shapes like: [ { data:[...] } ] OR { data:[...] } OR plain array of rows
function coerceRows(input: any): any[] {
  if (Array.isArray(input)) {
    const withData = input.flatMap(x => (Array.isArray(x?.data) ? x.data : []));
    if (withData.length) return withData;
    return input; // assume it's already rows
  }
  if (Array.isArray(input?.data)) return input.data;
  return [];
}

type Row = {
  date?: string;                // "YYYY-MM-DD HH:mm:ss"
  usage?: number | string;      // cost
  requests?: number | string;
  model_permaslug?: string;
  model?: string;
};

export function reduceOpenRouterPayload(
  payload: any,
  options?: { dateMode?: "minmax" | "arrayOrder" }
): OpenRouterData {
  const rows: Row[] = coerceRows(payload);

  if (!rows.length) {
    return {
      credits_used: 0,
      credits_remaining: 0,
      models: [],
      total_cost: 0,
      requests: 0,
      start_date: null,
      end_date: null,
    };
  }

  // total cost + total requests + unique models
  let totalCost = 0;
  let totalReq = 0;
  const modelSet = new Set<string>();
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const r of rows) {
    const d = (r.date ? String(r.date).slice(0, 10) : null); // YYYY-MM-DD
    if (d) {
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    }
    totalCost += Number(r.usage ?? 0);
    totalReq  += Number(r.requests ?? 0);

    const m = r.model_permaslug || r.model;
    if (m) modelSet.add(m);
  }

  // Optional: use array order instead of min/max
  if (options?.dateMode === "arrayOrder") {
    const first = rows[0]?.date ? String(rows[0].date).slice(0, 10) : minDate;
    const last  = rows[rows.length - 1]?.date ? String(rows[rows.length - 1].date).slice(0, 10) : maxDate;
    minDate = last ?? minDate;
    maxDate = first ?? maxDate;
  }

  // If you want the credits bar to reflect cost directly (no credits API),
  // map cost → used and keep remaining 0. Adjust if you have real credits.
  const rounded = Math.round(totalCost * 1e6) / 1e6;

  return {
    credits_used: rounded,
    credits_remaining: 0,
    models: Array.from(modelSet),
    total_cost: rounded,
    requests: totalReq,
    start_date: minDate,
    end_date: maxDate,
  };
}
