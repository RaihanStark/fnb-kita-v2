"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface SalesChartProps {
  period: string;
}

export function SalesChart({ period }: SalesChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageSales, setAverageSales] = useState(0);

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/monthly?period=${period}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      const result = await response.json();

      if (result.success) {
        // Calculate moving average (7-day window, ignoring 0 values)
        const calculateMovingAverage = (data: any[], index: number, window: number = 7) => {
          const start = Math.max(0, index - window + 1);
          const end = index + 1;
          const windowData = data.slice(start, end).filter((d: any) => d.sales > 0);
          
          if (windowData.length === 0) return 0;
          
          const sum = windowData.reduce((acc: number, d: any) => acc + d.sales, 0);
          return sum / windowData.length;
        };
        
        // Transform the data for the chart with moving average
        const chartData = result.dailyData.map((day: any, index: number) => ({
          day: day.day,
          date: day.displayDate,
          sales: day.sales, 
          movingAverage: calculateMovingAverage(result.dailyData, index),
          transactions: day.transactions,
          items: day.items,
        }));

        setData(chartData);
        
        // Calculate overall average for reference
        const daysWithSales = result.dailyData.filter((day: any) => day.sales > 0);
        const totalSales = daysWithSales.reduce((sum: number, day: any) => sum + day.sales, 0);
        const avgSales = daysWithSales.length > 0 ? totalSales / daysWithSales.length : 0;
        setAverageSales(avgSales);
      } else {
        throw new Error(result.error || "Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      // Fallback to empty data or show error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}, ${data.date}`}</p>
          <p className="text-green-600">
            Penjualan: {formatCurrency(data.sales)}
          </p>
          <p className="text-orange-600">
            Rata-rata Bergerak: {formatCurrency(data.movingAverage)}
          </p>
          <p className="text-blue-600">Transaksi: {data.transactions} kali</p>
          <p className="text-purple-600">Item: {data.items} pcs</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data penjualan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }} 
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ fill: "#16a34a", r: 4 }}
            activeDot={{ r: 6 }}
            name="Penjualan (Rp)"
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: "#f97316", r: 3 }}
            activeDot={{ r: 5 }}
            name="Rata-rata Bergerak 7 Hari (Rp)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
