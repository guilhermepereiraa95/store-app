'use client';
import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SaleData {
  name: string;
  sales: number;
}

interface PieData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const MONTHS_ORDER = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

export function Dashboard() {
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const salesSnapshot = await getDocs(collection(db, 'sales'));
        const salesDataMap: Record<string, SaleData> = {};

        salesSnapshot.docs.forEach((doc) => {
          const sale = doc.data();
          const date = sale.date.toDate();
          const month = date.toLocaleString('default', { month: 'short' });
          
          if (!salesDataMap[month]) {
            salesDataMap[month] = { name: month, sales: 0 };
          }
          
          salesDataMap[month].sales += Number(sale.amount);
        });
        
        const salesArray: SaleData[] = Object.values(salesDataMap);
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productCategories: Record<string, number> = {};

        productsSnapshot.docs.forEach((doc) => {
          const product = doc.data();
          if (!productCategories[product.category]) {
            productCategories[product.category] = 0;
          }
          productCategories[product.category] += 1;
        });

        const pieDataArray: PieData[] = Object.keys(productCategories).map(key => ({
          name: key,
          value: productCategories[key],
        }));
        
        salesArray.sort((a, b) => {
          return MONTHS_ORDER.indexOf(a.name) - MONTHS_ORDER.indexOf(b.name);
        });

        setSalesData(salesArray);
        setPieData(pieDataArray);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Line Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Sales Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Sales by Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Product Categories</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
