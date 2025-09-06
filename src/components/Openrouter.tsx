import React, { useEffect, useMemo, useState } from "react";
import type { OpenRouterData } from "./ApiDashboard";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { reduceOpenRouterPayload } from "../utils/helper";

type Props = {
  
  webhookUrl: string;

  defaultDate?: string; 
};

const todayYMD = () => new Date().toISOString().slice(0, 10);

const OpenRouterCard: React.FC<Props> = ({ webhookUrl, defaultDate }) => {
  
  const [mode, setMode] = useState<"rolling30" | "single">("rolling30");
  const [date, setDate] = useState<string>(defaultDate || todayYMD());


  const [data, setData] = useState<OpenRouterData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

     
        let url = "";
        if (mode === "rolling30") {
          url = `${webhookUrl}`; 
        } else {
          let tempDate = adjustForUTC(date)
          url = `${webhookUrl}?date=${tempDate}`; 
        }

        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

        const payload = await res.json();
        const orData: OpenRouterData = payload.openrouter ?? payload;
        const reducedData = reduceOpenRouterPayload(orData)
        setData(reducedData || null);
        setUpdatedAt(new Date());
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [webhookUrl,mode, date]);

  function adjustForUTC(localYmd: string): string {
  // localYmd comes from <input type="date"> as "YYYY-MM-DD"
  const d = new Date(localYmd + "T00:00:00"); // interprets as local midnight
  // Subtract one UTC day to align with OpenRouter’s UTC interpretation
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10); // back to YYYY-MM-DD (UTC)
}
  /** -------- derived UI numbers -------- */
  const { totalCredits, usagePercent, modelsCount } = useMemo(() => {
    const used = data?.credits_used ?? 0;
    const remaining = data?.credits_remaining ?? 0;
    const total = used + remaining;
    return {
      totalCredits: total,
      usagePercent: total > 0 ? (used / total) * 100 : 0,
      modelsCount: data?.models?.length ?? 0,
    };
  }, [data]);

  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>OpenRouter</span>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          </h3>
          <p className="text-sm text-gray-400">
            {modelsCount} models
            {updatedAt && (
              <span className="ml-2 text-xs text-gray-500">
                · Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {loading ? (
          <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
        ) : (
          <Activity className="w-6 h-6 text-orange-400" />
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-orange-500"
              checked={mode === "rolling30"}
              onChange={() => setMode("rolling30")}
            />
            Last 30 days (aggregated)
          </label>
          <label className="inline-flex items-center gap-2 ml-4">
            <input
              type="radio"
              className="accent-orange-500"
              checked={mode === "single"}
              onChange={() => setMode("single")}
            />
            Single day
          </label>
        </div>

        {mode === "single" && (
          <label className="ml-auto text-xs text-gray-400">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ml-2 bg-gray-800 text-gray-200 text-sm rounded-md px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Body */}
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Credits</span>
            <span className="text-orange-400 font-semibold">
              {(data?.credits_used ?? 0)} / {totalCredits}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-orange-500"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400">Cost</p>
            <p className="text-lg font-semibold text-green-400">
              ${((data?.total_cost ?? 0)).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400">Requests</p>
            <p className="text-lg font-semibold text-blue-400">
              {data?.requests ?? 0}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-3 col-span-2">
            <p className="text-xs text-gray-400">Date / Range</p>
            <p className="text-sm text-gray-300">
              {mode === "rolling30"
                ? `${data?.start_date ?? "—"} — ${data?.end_date ?? "—"}`
                : `${date}`}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Models: {(data?.models || []).join(", ")}
        </div>
      </div>
    </div>
  );
};

export default React.memo(OpenRouterCard);
