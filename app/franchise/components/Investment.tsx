"use client";

import React from "react";
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

const ScalableInvestmentTiers = () => {
  const investmentData = [
    {
      name: "Tier 1: Takeout Stall",
      capital: 0.8,
    },
    {
      name: "Tier 2: Mall Kiosk",
      capital: 1.5,
    },
    {
      name: "Tier 3: Delivery Hub Store",
      capital: 2.1,
    },
    {
      name: "Tier 4: Fast Casual Mall",
      capital: 4.8,
    },
    {
      name: "Tier 5: Full-Scale Flagship",
      capital: 9.7,
    },
    {
      name: "Tier 6: Premium Dining",
      capital: 15,
    },
  ];

  const tiers = [
    {
      tier: "Tier 1",
      name: "Takeout Stall",
      capital: "₱800K - 1.2M",
      sqft: "80-150 sqft",
      seats: "No dine-in",
      features: [
        "Essential grilling equipment",
        "Minimal overhead",
        "High visibility location",
      ],
    },
    {
      tier: "Tier 2",
      name: "Mall Kiosk",
      capital: "₱1.5M - 2.2M",
      sqft: "150-250 sqft",
      seats: "4-6 seats",
      features: [
        "Standard kitchen setup",
        "Mall foot traffic",
        "Quick-service model",
      ],
    },
    {
      tier: "Tier 3",
      name: "Delivery Hub Store",
      capital: "₱2.1M - 3.5M",
      sqft: "250-400 sqft",
      seats: "8-10 seats",
      features: [
        "Full kitchen with order system",
        "Delivery integration",
        "Modest dine-in space",
      ],
    },
    {
      tier: "Tier 4",
      name: "Fast Casual Mall",
      capital: "₱4.8M - 6.5M",
      sqft: "400-600 sqft",
      seats: "20-30 seats",
      features: [
        "Full-service counter",
        "Comfortable seating",
        "POS system",
      ],
    },
    {
      tier: "Tier 5",
      name: "Full-Scale Flagship",
      capital: "₱9.7M - 12M",
      sqft: "1,000-1,500 sqft",
      seats: "50-70 seats",
      features: [
        "Commercial kitchen",
        "Full table service",
        "Private dining option",
      ],
    },
    {
      tier: "Tier 6",
      name: "Premium Dining",
      capital: "₱15M+",
      sqft: "1,500-2,500 sqft",
      seats: "100+ seats",
      features: [
        "Premium ambiance",
        "Full bar service",
        "Private event space",
      ],
    },
  ];

  const CustomTooltip = ({ active, payload } : {active: boolean, payload: any}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white shadow-lg">
          <p className="font-semibold text-sm">{payload[0].payload.name}</p>
          <p className="text-orange-500 font-bold">
            ₱{payload[0].value.toFixed(1)}M
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex flex-col items-center gap-6 mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-center text-slate-900">
              Scalable Investment Tiers
            </h1>
            <div className="w-20 h-1 bg-orange-500 rounded-full" />
          </div>
          
          <p className="max-w-3xl mx-auto text-center text-lg sm:text-xl text-gray-600 leading-relaxed">
            Whether you are a first-time entrepreneur or a seasoned restaurateur looking for a
            flagship location, we have a meticulously designed franchise package to match your
            budget and real estate strategy.
          </p>
        </div>

        {/* Chart Section */}
        <div className="bg-gray-50 rounded-2xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            Capital Investment Progression
          </h2>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={investmentData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12, fill: "#475569" }}
              />
              <YAxis
                label={{ value: "Capital (Millions PHP)", angle: -90, position: "insideLeft" }}
                tick={{ fontSize: 12, fill: "#475569" }}
              />
              <Tooltip content={CustomTooltip} />
              <Bar
                dataKey="capital"
                fill="#f97316"
                radius={[8, 8, 0, 0]}
                name="Estimated Maximum Capital"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-8 bg-white border-l-4 border-orange-500 p-6 rounded-lg">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The bar chart above visualizes the estimated maximum capital investment required for each of
              our 6 franchise tiers. Each tier is strategically designed to maximize operational efficiency and minimize physical footprint and service capacity, increasing as your investment grows.
            </p>
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tierInfo, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold text-orange-500 mb-1">
                  {tierInfo.tier}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {tierInfo.name}
                </h3>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Capital Investment
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {tierInfo.capital}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Space Required
                  </p>
                  <p className="text-sm text-slate-700">{tierInfo.sqft}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Seating Capacity
                  </p>
                  <p className="text-sm text-slate-700">{tierInfo.seats}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Key Features
                </p>
                <ul className="space-y-2">
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScalableInvestmentTiers;