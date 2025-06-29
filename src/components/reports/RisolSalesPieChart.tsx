"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface RisolSalesData {
  name: string;
  value: number;
  percentage: number;
}

interface RisolSalesPieChartProps {
  period: string;
}

const COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export function RisolSalesPieChart({ period }: RisolSalesPieChartProps) {
  const [data, setData] = useState<RisolSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSold, setTotalSold] = useState(0);

  useEffect(() => {
    fetchRisolSalesData();
  }, [period]);

  const fetchRisolSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/weekly?period=${period}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch risol sales data');
      }

      const result = await response.json();
      
      if (result.success && result.risolSales) {
        const salesData = result.risolSales;
        const total = salesData.reduce((sum: number, item: any) => sum + item.quantity, 0);
        
        const formattedData = salesData.map((item: any, index: number) => ({
          name: item.variant,
          value: item.quantity,
          percentage: total > 0 ? (item.quantity / total * 100) : 0
        }));
        
        setData(formattedData);
        setTotalSold(total);
      }
    } catch (error) {
      console.error("Error fetching risol sales data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 bg-background border shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Jumlah: {payload[0].value} pcs
          </p>
          <p className="text-sm text-muted-foreground">
            Persentase: {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </Card>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percentage
  }: any) => {
    if (percentage < 5) return null; // Don't show label for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-medium text-sm"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Tidak ada data penjualan risol</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Total Risol Terjual</p>
        <p className="text-2xl font-bold">{totalSold} pcs</p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => `${value} (${entry.value} pcs)`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}