"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DefectsByFirmaProps {
  className?: string;
}

interface ChartData {
  name: string;
  count: number;
  gewerk: string;
}

export function DefectsByFirma({ className }: DefectsByFirmaProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGewerk, setSelectedGewerk] = useState<string>("alle");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/stats");
        const stats = await response.json();
        setData(stats.byFirma || []);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get unique gewerke for filter
  const gewerke = Array.from(new Set(data.map((d) => d.gewerk))).sort();

  // Filter data by selected gewerk
  const filteredData =
    selectedGewerk === "alle"
      ? data.slice(0, 15) // Show top 15 if all
      : data.filter((d) => d.gewerk === selectedGewerk);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Lade Daten...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">
          Gewerk filtern:
        </label>
        <select
          value={selectedGewerk}
          onChange={(e) => setSelectedGewerk(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="alle">Alle</option>
          {gewerke.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300} className={className}>
        <BarChart
          data={filteredData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#16A34A" name="Anzahl Mängel" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
