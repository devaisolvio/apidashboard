import React, { useRef } from "react";
import { CheckCircle } from "lucide-react";
import type { OpenAIBucket } from "./ApiDashboard"; // your type

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const toYMD = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 10);
const ymdToUnix = (ymd: string) =>
  Math.floor(new Date(`${ymd}T00:00:00`).getTime() / 1000);

export const OpenAICard: React.FC<{
  data: OpenAIBucket[];
  /** optional: parent handles the fetch with these unix seconds */
  onApplyRange?: (startUnix: number, endUnix: number) => void;

  applying?: boolean;
}> = ({ data, onApplyRange}) => {
  // Totals & range (safe defaults if empty)
  const totalCost = Array.isArray(data)
    ? data.reduce(
        (sum, b) =>
          sum +
          (b.results ?? []).reduce((s, r) => s + (r.amount?.value ?? 0), 0),
        0
      )
    : 0;

  const totalRecords = Array.isArray(data)
    ? data.reduce((sum, b) => sum + (b.results?.length ?? 0), 0)
    : 0;

  const minStart =
    Array.isArray(data) && data.length
      ? Math.min(...data.map((b) => b.start_time ?? Number.POSITIVE_INFINITY))
      : Math.floor((Date.now() - 7 * 864e5) / 1000); // last 7 days fallback

  const maxEnd =
    Array.isArray(data) && data.length
      ? Math.max(...data.map((b) => b.end_time ?? 0))
      : Math.floor(Date.now() / 1000);

  const orgIds = Array.isArray(data)
    ? Array.from(
        new Set(
          data.flatMap((b) =>
            (b.results ?? []).map((r) => r.organization_id).filter(Boolean)
          )
        )
      )
    : [];

  const orgLabel =
    orgIds.length === 0
      ? "—"
      : orgIds.length === 1
      ? orgIds[0]!
      : `${orgIds[0]} + ${orgIds.length - 1} more`;

  // Uncontrolled inputs so we don't add React state
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const handleApply = () => {
    if (!onApplyRange) return;
    const startYmd = startRef.current?.value || toYMD(minStart);
    const endYmd = endRef.current?.value || toYMD(maxEnd);
    const start = ymdToUnix(startYmd);
    const end = ymdToUnix(endYmd);
    console.log(start,end);
    onApplyRange(start, end);
  };

  // Empty state shell (keeps header and controls visible)
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-slate-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">OpenAI</h3>
            <p className="text-sm text-slate-400">Costs (USD)</p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        {/* Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-400">
            Start
            <input
              type="date"
              defaultValue={toYMD(minStart)}
              ref={startRef}
              className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            End
            <input
              type="date"
              defaultValue={toYMD(maxEnd)}
              ref={endRef}
              className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <button
            onClick={handleApply}
            disabled={!onApplyRange}
            className="ml-auto inline-flex items-center rounded-md bg-emerald-500 text-white text-sm font-semibold px-3 py-2 hover:bg-emerald-600 disabled:opacity-60"
          >
            Apply
          </button>
        </div>
        No data currently
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">OpenAI</h3>
          <p className="text-sm text-slate-400">Costs (USD)</p>
        </div>
        <CheckCircle className="w-5 h-5 text-emerald-400" />
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 flex flex-col items-center justify-center rounded-xl p-3 mb-4 ">
      <div className=" border border-slate-800 flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-400">
          Start
          <input
            type="date"
            defaultValue={toYMD(minStart)}
            ref={startRef}
            className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <label className="text-xs text-slate-400">
          End
          <input
            type="date"
            defaultValue={toYMD(maxEnd)}
            ref={endRef}
            className="ml-2 bg-slate-800 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        </div>
        <button
          onClick={handleApply}
          disabled={!onApplyRange}
          className="  inline-flex mt-2 items-center rounded-md bg-emerald-500 text-white text-sm font-semibold px-3 py-2 hover:bg-emerald-600 disabled:opacity-60"
        >
           Apply
        </button>
      </div>

      <div className="space-y-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Cost</div>
            <div className="text-2xl font-semibold text-emerald-400">
              {currency.format(totalCost)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Records</div>
            <div className="text-2xl font-semibold text-blue-400">
              {totalRecords}
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
