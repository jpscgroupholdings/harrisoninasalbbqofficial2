"use client";

import { getLucideIcon } from "@/lib/iconUtils";
import React, { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const TheOpportunity = () => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const menuDetails = [
    {
      icon: "Drumstick",
      name: "Signature Inasal Chicken",
      description:
        "Proprietary house marinade ensuring a consistent, high-demand flavor profile.",
    },
    {
      icon: "Ham",
      name: "Premium Pork BBQ",
      description:
        "Classic Filipino favorites including exclusive Chinese-style roasted variants.",
    },
    {
      icon: "Beef",
      name: "High-Value Combo Meals",
      description:
        "Affordable, filling meals with high-margin add-ons. Accessible entry price points of PHP 99 - 150.",
    },
  ];

  const mealData = [
    { name: "Signature Inasal Chicken", value: 40, color: "#DC2626" },
    { name: "Premium Pork BBQ", value: 30, color: "#F97316" },
    { name: "Combo Rice Meals", value: 20, color: "#FBBF24" },
    { name: "Drinks & Add-ons", value: 10, color: "#EA580C" },
  ];

  const CustomTooltip = ({ active, payload } : {active: boolean, payload: any}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-black shadow-lg rounded-xl px-4 py-2 border">
        <p className="font-semibold text-white">{data.name}</p>
         <div className="flex items-center gap-2">
             <div className={`w-2 h-2 border border-white`} style={{backgroundColor: data.color}}></div>
                     <p className="text-sm text-white">
              <span className="font-bold">{data.value}</span>
                     </p>
         </div>
      </div>
    );
  }

  return null;
};

  return (
    <div id="opportunity" className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="flex flex-col items-center gap-6 mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-center text-slate-900">
            The Modern Filipino Food Franchise
          </h1>
          <div className="w-20 h-1 bg-orange-500 rounded-full" />
        </div>

        <p className="max-w-3xl mx-auto text-center text-lg sm:text-xl text-gray-600 leading-relaxed">
          Harrisons House of Inasal and BBQ isn't just a restaurant; it's a
          strategically engineered culinary system. We aim to become the go-to
          brand by delivering consistent quality, unbeatable value, and highly
          adaptable footprints that guarantee strong community appeal.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Menu Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                A Menu Engineered for Success
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Our core offerings are intentionally streamlined. This
                simplicity is our superpower, driving high margins, rapid table
                turnover, and unforgettable flavor consistency.
              </p>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {menuDetails.map((item, index) => {
                const Icon = getLucideIcon(item.icon);
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="shrink-0 mt-1">
                      <Icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Chart and Insights */}
          <div className="flex flex-col gap-8">
            {/* Donut Chart */}
            <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, index) => setHoveredSegment(index)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    {mealData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          hoveredSegment === null || hoveredSegment === index
                            ? 1
                            : 0.4
                        }
                        style={{ transition: "opacity 0.2s ease" }}
                      />
                    ))}
                    <Tooltip content={CustomTooltip}/>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend - Horizontal Layout like the image */}
            <div className="flex flex-wrap gap-6 justify-center items-center">
              {mealData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Insight Box */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2">
                Visualizing Operational Efficiency
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                This donut chart illustrates our focused menu distribution. By
                concentrating 80% of our offerings on core, high-volume items
                (Chicken, Pork, Rice), we drastically reduce ingredient spoilage
                and simplify kitchen training, directly boosting bottom-line
                profitability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheOpportunity;
