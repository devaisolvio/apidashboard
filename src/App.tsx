import React, { useState } from "react";
import ApiDashboard from "./components/ApiDashboard";
import ClientUsage from "./components/ClientUsage";
import Demo from "./components/Demo";
import InternalUsage from "./components/InternalUsage";

type View = "api" | "client" | "internal" | "demo";


const App: React.FC = () => {
  const [view, setView] = useState<View>("api");



  return (
    <div className="mx-auto p-4 bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LLM API Dashboard
          </h1>
        </div>
      </div>

      {/* Toggle */}
      <div className="inline-flex rounded-lg overflow-hidden border border-gray-700 mb-4">
        <button
          onClick={() => setView("api")}
          className={`px-4 py-2 text-sm transition ${
            view === "api"
              ? "bg-orange-500 text-white"
              : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
          aria-pressed={view === "api"}
        >
          API Dashboard
        </button>

        <button
          onClick={() => setView("client")}
          className={`px-4 py-2 text-sm transition ${
            view === "client"
              ? "bg-orange-500 text-white"
              : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
          aria-pressed={view === "client"}
        >
          Client Usage
        </button>

        <button
          onClick={() => setView("internal")}
          className={`px-4 py-2 text-sm transition ${
            view === "internal"
              ? "bg-orange-500 text-white"
              : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
          aria-pressed={view === "internal"}
        >
          Internal Usage
        </button>

        <button
          onClick={() => setView("demo")}
          className={`px-4 py-2 text-sm transition ${
            view === "demo"
              ? "bg-orange-500 text-white"
              : "bg-gray-800 text-gray-300 hover:text-white"
          }`}
          aria-pressed={view === "demo"}
        >
          Demo
        </button>
      </div>

      {/* Views */}
     {
      view ==="api" && <ApiDashboard/>
     }
     {
      view ==="client" && <ClientUsage/>
     }
     {
      view ==="demo" && <Demo/>
     }
     {
      view ==="internal" && <InternalUsage/>
     }
    </div>
  );
};


export default App;
