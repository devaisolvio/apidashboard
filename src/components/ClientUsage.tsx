import React from "react";



const ClientUsage: React.FC= ()=> {
  // Accept array or object; normalize to an array to render cards
/*   const items: AnyObj[] = Array.isArray(data) ? data : data?.items ?? [];
 */
/*   if (!items.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
        No data currently
      </div>
    );
  }
 */
  return (
        <div className="mx-auto p-4 bg-gray-900 h-screen"> 
     {/*  {items.map((item, idx) => (
        <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-white font-semibold">{item.name ?? "Client"}</div>
          <div className="text-gray-400 text-sm">Requests: {item.requests ?? "—"}</div>
          <div className="text-gray-400 text-sm">
            Cost: {item.cost != null ? `$${item.cost}` : "—"}
          </div>
        </div>
      ))} */}
    </div>
  );
};

export default ClientUsage;
