import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { OpenAICard } from './Openai';
import OpenRouterCard from './Openrouter';
import { reduceOpenRouterPayload } from '../utils/helper';

// Simple interfaces - one for each provider's raw data
// Root payload
// ---- leaf types
export interface OpenAIAmount {
  value: number;
  currency: string; // e.g. "usd"
}

export interface OpenAIResult {
  object: "organization.costs.result" | string;
  amount: OpenAIAmount;           // <-- object, not number
  line_item: string | null;
  project_id: string | null;
  organization_id: string;
}

export interface OpenAIBucket {
  object: "bucket" | string;
  start_time: number; // unix seconds
  end_time: number;   // unix seconds
  results: OpenAIResult[];
}

// ---- page container (what your sample shows)
export interface OpenAIPage {
  object: "page" | string;
  has_more: boolean;
  next_page: string | null;
  data: OpenAIBucket[];
}

// ---- accept the common shapes you may get
export type OpenAIInput =
  | OpenAIPage[]                // your sample: an array of pages
  | OpenAIPage                  // a single page
  | { data: OpenAIBucket[] }    // sometimes just a { data: [...] } envelope
  | OpenAIBucket[]              // plain array of buckets
  | { openai: OpenAIBucket[] }; // if you wrap it yourself elsewhere



export type OpenRouterData = {
  credits_used: number;
  credits_remaining: number;
  models: string[];
  total_cost: number;
  requests: number;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;   // YYYY-MM-DD
};



// N8n webhook payload
interface WebhookData {
  timestamp: string;
  openai?: OpenAIBucket[];
  openrouter?: OpenRouterData;
}



// Main Dashboard Component
const ApiDashboard: React.FC = () => {
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const nowSec = () => Math.floor(Date.now() / 1000);
const daysAgo = (d: number) => nowSec() - d * 86400;
 const [range, setRange] = useState<{start: number; end: number}>({
    start: daysAgo(7),
    end: nowSec(),
  });




  // Fetch data from N8n webhook
  useEffect(() => {
    setIsLoading(true)
  const ctrl = new AbortController();
  

  (async () => {
    try {
      const url = `https://aisolv2.app.n8n.cloud/webhook/276034e8-4b97-48d4-930c-42ae583c2b08?start_date=${range.start}&end_date=${range.end}`;
      const res = await fetch(url, {
        method: "GET"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WebhookData = await res.json();
      
      setWebhookData(data);
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("fetch failed:", err);
        // optionally set an error state here
      }
    }finally{
        setIsLoading(false)
    }
  })();


  return () =>{
  
     ctrl.abort()
    };

  

  }, [range.start, range.end]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading API data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
        <div className="text-sm text-gray-400 mb-6 ">
                    Last updated: <span className='text-emerald-400'>{lastUpdated.toLocaleTimeString()}</span>
                  </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* OpenAI Card */}
        {webhookData?.openai && (
          <OpenAICard 
          data={webhookData.openai} 
      onApplyRange={(start, end) => setRange({ start, end })}
          />
        )}

      

        {/* OpenRouter Card */}
       {webhookData?.openrouter && (
          <OpenRouterCard data={reduceOpenRouterPayload(webhookData.openrouter)} />
        )} 

       

      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Real-time monitoring • Data from N8n webhooks</p>
      </div>
    </div>
  );
};



export default ApiDashboard;