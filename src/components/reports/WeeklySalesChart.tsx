"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface WeeklySalesChartProps {
  period: string;
}

export function WeeklySalesChart({ period }: WeeklySalesChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/weekly?period=${period}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Transform the data for the chart
        const chartData = result.dailyData.map((day: any) => ({
          day: day.day,
          date: day.displayDate,
          sales: day.sales,
          transactions: day.transactions,
          items: day.items,
        }));
        
        setData(chartData);
      } else {
        throw new Error(result.error || 'Failed to fetch sales data');
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
          <p className="text-blue-600">
            Transaksi: {data.transactions} kali
          </p>
          <p className="text-purple-600">
            Item: {data.items} pcs
          </p>
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="sales" 
            fill="#16a34a" 
            name="Penjualan (Rp)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Additional Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium text-green-600">
            {formatCurrency(data.reduce((sum, item) => sum + item.sales, 0))}
          </p>
          <p className="text-muted-foreground">Total Penjualan</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-600">
            {data.reduce((sum, item) => sum + item.transactions, 0)} kali
          </p>
          <p className="text-muted-foreground">Total Transaksi</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-purple-600">
            {data.reduce((sum, item) => sum + item.items, 0)} pcs
          </p>
          <p className="text-muted-foreground">Total Item</p>
        </div>
      </div>
    </div>
  );
}