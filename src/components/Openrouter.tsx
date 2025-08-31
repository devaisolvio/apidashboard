import type { OpenRouterData } from "./ApiDashboard";
import { Activity } from "lucide-react";

const OpenRouterCard: React.FC<{ data: OpenRouterData }> = ({ data }) => {
  const totalCredits = data.credits_used + data.credits_remaining;
  const usagePercent = totalCredits > 0 ? (data.credits_used / totalCredits) * 100 : 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>OpenRouter</span>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          </h3>
          <p className="text-sm text-gray-400">{data.models.length} models</p>
        </div>
        <Activity className="w-6 h-6 text-orange-400" />
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Credits</span>
            <span className="text-orange-400 font-semibold">
              {data.credits_used} / {totalCredits}
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
              ${data.total_cost.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400">Requests</p>
            <p className="text-lg font-semibold text-blue-400">{data.requests}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 col-span-2">
            <p className="text-xs text-gray-400">Date Range</p>
            <p className="text-sm text-gray-300">
              {data.start_date ?? "—"} — {data.end_date ?? "—"}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Models: {data.models.join(", ")}
        </div>
      </div>
    </div>
  );
};

export default OpenRouterCard;
