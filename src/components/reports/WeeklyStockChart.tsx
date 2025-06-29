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
  BarChart,
  Bar,
} from "recharts";

interface WeeklyStockChartProps {
  period: string;
}

export function WeeklyStockChart({ period }: WeeklyStockChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, [period]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/weekly?period=${period}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Transform the data for the chart
        const chartData = result.dailyData.map((day: any) => ({
          day: day.day,
          date: day.displayDate,
          openingStock: day.openingStock,
          purchased: day.purchased,
          sold: day.sold,
          damaged: day.damaged,
          closingStock: day.closingStock,
        }));
        
        setData(chartData);
      } else {
        throw new Error(result.error || 'Failed to fetch stock data');
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
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
          <p className="text-blue-600">
            Stok Awal: {data.openingStock} pcs
          </p>
          <p className="text-green-600">
            Dibeli: +{data.purchased} pcs
          </p>
          <p className="text-orange-600">
            Terjual: -{data.sold} pcs
          </p>
          <p className="text-red-600">
            Rusak: -{data.damaged} pcs
          </p>
          <p className="text-purple-600 font-medium">
            Stok Akhir: {data.closingStock} pcs
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
          <p className="text-muted-foreground">Memuat data stok...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Level Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Jumlah (pcs)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="closingStock"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Stok Akhir"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="openingStock"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Stok Awal"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stock Movement Chart */}
      <div className="h-80">
        <h3 className="text-lg font-medium mb-4">Pergerakan Stok</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value} pcs`, 
                name === 'purchased' ? 'Pembelian' : 
                name === 'sold' ? 'Penjualan' : 
                name === 'damaged' ? 'Rusak' : name
              ]}
            />
            <Legend 
              formatter={(value) => 
                value === 'purchased' ? 'Pembelian' : 
                value === 'sold' ? 'Penjualan' : 
                value === 'damaged' ? 'Rusak' : value
              }
            />
            <Bar 
              dataKey="purchased" 
              fill="#16a34a" 
              name="purchased"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="sold" 
              fill="#f97316" 
              name="sold"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="damaged" 
              fill="#dc2626" 
              name="damaged"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stock Summary */}
      <div className="grid grid-cols-5 gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium text-blue-600">
            {data[0]?.openingStock || 0} pcs
          </p>
          <p className="text-muted-foreground">Stok Awal Minggu</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-green-600">
            +{data.reduce((sum, item) => sum + item.purchased, 0)} pcs
          </p>
          <p className="text-muted-foreground">Total Pembelian</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-orange-600">
            -{data.reduce((sum, item) => sum + item.sold, 0)} pcs
          </p>
          <p className="text-muted-foreground">Total Terjual</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-red-600">
            -{data.reduce((sum, item) => sum + item.damaged, 0)} pcs
          </p>
          <p className="text-muted-foreground">Total Rusak</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-purple-600">
            {data[data.length - 1]?.closingStock || 0} pcs
          </p>
          <p className="text-muted-foreground">Stok Akhir</p>
        </div>
      </div>
    </div>
  );
}