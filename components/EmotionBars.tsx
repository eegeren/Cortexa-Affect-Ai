"use client";
import React from "react";
export default function EmotionBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,8);
  return (
    <div className="w-full max-w-xl space-y-2 mt-6">
      {entries.map(([k,v])=>(
        <div key={k}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{k}</span>
            <span>{Math.round(v)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded">
            <div className="h-3 rounded bg-blue-600" style={{ width: `${Math.max(0,Math.min(100,v))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
