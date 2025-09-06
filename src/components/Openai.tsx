import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, RefreshCw } from "lucide-react";
import type { OpenAIBucket } from "./ApiDashboard";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const toYMD = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 10);
const ymdToUnix = (ymd: string) =>
  Math.floor(new Date(`${ymd}T00:00:00Z`).getTime() / 1000);

const nowSec = () => Math.floor(Date.now() / 1000);
const daysAgo = (d: number) => nowSec() - d * 86400;

type Props = {
  /** n8n webhook that returns { openai: OpenAIBucket[] } */
  webhookUrl: string;
  /** default range; last 7 days if omitted */
  initialDays?: number;
};

export const OpenAICard: React.FC<Props> = ({ webhookUrl, initialDays = 7 }) => {
  /** -------- range owned by the card -------- */
  const [range, setRange] = useState<{ start: number; end: number }>({
    start: daysAgo(initialDays),
    end: nowSec(),
  });

  /** -------- data / loading / error -------- */
  const [data, setData] = useState<OpenAIBucket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  /** -------- uncontrolled date inputs (same as your code) -------- */
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  /** -------- fetch just for this card -------- */
  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${webhookUrl}?start_date=${range.start}&end_date=${range.end}`;
        const res = await fetch(url, { method: "GET", signal: ctrl.signal });
        if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);

        const payload = await res.json();
        const buckets: OpenAIBucket[] = payload.openai ?? payload?.data ?? [];
        setData(Array.isArray(buckets) ? buckets : []);
        setUpdatedAt(new Date());
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [webhookUrl, range.start, range.end]);

  /** -------- apply button keeps your ref-based UX -------- */
  const handleApply = () => {
    const startYmd = startRef.current?.value || toYMD(range.start);
    const endYmd = endRef.current?.value || toYMD(range.end);
    const start = ymdToUnix(startYmd);
    const end = ymdToUnix(endYmd);
    // guard if end < start
    if (end < start) return alert("End date must be on/after start date");
    setRange({ start, end });
  };

  /** -------- derived metrics (memoized) -------- */
  const { totalCost, totalRecords, minStart, maxEnd, orgLabel } = useMemo(() => {
    const buckets = data ?? [];
    const totalCost = buckets.reduce(
      (sum, b) =>
        sum +
        (b.results ?? []).reduce((s, r: any) => s + (r.amount?.value ?? 0), 0),
      0
    );
    const totalRecords = buckets.reduce(
      (sum, b) => sum + (b.results?.length ?? 0),
      0
    );
    const minStart =
      buckets.length > 0
        ? Math.min(...buckets.map((b) => b.start_time ?? Number.POSITIVE_INFINITY))
        : range.start;
    const maxEnd =
      buckets.length > 0
        ? Math.max(...buckets.map((b) => b.end_time ?? 0))
        : range.end;

    const orgIds =
      buckets.length > 0
        ? Array.from(
            new Set(
              buckets
                .flatMap((b) => (b.results ?? []).map((r: any) => r.organization_id))
                .filter(Boolean)
            )
          )
        : [];
    const orgLabel =
      orgIds.length === 0
        ? "—"
        : orgIds.length === 1
        ? orgIds[0]!
        : `${orgIds[0]} + ${orgIds.length - 1} more`;

    return { totalCost, totalRecords, minStart, maxEnd, orgLabel };
  }, [data, range.start, range.end]);

  /** -------- UI -------- */
  if (error) {
    return (
      <div className="bg-slate-800 border border-red-600/40 rounded-2xl p-6 text-slate-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">OpenAI</h3>
            <p className="text-sm text-slate-400">Costs (USD)</p>
          </div>
        </div>
        <div className="text-red-400 text-sm">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">OpenAI</h3>
          <p className="text-sm text-slate-400">
            Costs (USD)
            {updatedAt && (
              <span className="ml-2 text-xs text-slate-500">
                · Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 flex flex-col items-center justify-center rounded-xl p-3 mb-4">
        <div className="border border-slate-800 flex flex-wrap items-center gap-3 p-2 rounded-lg">
          <label className="text-xs text-slate-400">
            Start
            <input
              type="date"
              defaultValue={toYMD(range.start)}
              ref={startRef}
              className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            End
            <input
              type="date"
              defaultValue={toYMD(range.end)}
              ref={endRef}
              className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
        </div>
        <button
          onClick={handleApply}
          disabled={loading}
          className="inline-flex mt-2 items-center rounded-md bg-emerald-500 text-white text-sm font-semibold px-3 py-2 hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "Applying…" : "Apply"}
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Cost</div>
            <div className="text-2xl font-semibold text-emerald-400">
              {currency.format(totalCost || 0)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Records</div>
            <div className="text-2xl font-semibold text-blue-400">
              {totalRecords || 0}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <p className="text-xs text-slate-400">Date Range</p>
          <p className="text-slate-200">
            {toYMD(minStart)} — {toYMD(maxEnd)}
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Org(s): <span className="text-slate-300">{orgLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OpenAICard);
