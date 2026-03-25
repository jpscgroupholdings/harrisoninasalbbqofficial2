import { getLucideIcon } from '@/lib/iconUtils';
import { DashboardStats } from '@/types/adminType';
import React from 'react';

interface DashboardCardsProps {
  stats: DashboardStats
}

const DashboardCard = ({stats} : DashboardCardsProps) => {

  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "Package",
      color: "bg-blue-600",
      change: "",
    },
    {
      title: "Total Revenue",
      value: `₱${stats.totalRevenue.toLocaleString()}`,
      icon: "CircleDollarSign",
      color: "bg-emerald-600",
      change: "",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: "ClockAlert",
      color: "bg-[#ef4501]",
      change: "",
    },
    {
      title: "Best Seller",
      value: stats.bestSellingProduct,
      icon: "Trophy",
      color: "bg-amber-600",
      change: `${stats.bestSellingCount} sold`,
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {cards.map((card, index) => {
          
          const Icon = getLucideIcon(card.icon);

          return (
            <div key={index} className='bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 group'>
              <div className='flex items-start justify-between mb-4'>
                <div className={`w-12 h-12 rounded ${card.color} text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon />
                </div>
                <span className='text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full'>
                  {card.change}
                </span>
              </div>

              <h3 className='text-stone-500 text-sm font-medium mb-2'>
                {card.title}
              </h3>
              <p className='text-3xl font-semibold text-stone-800'>{card.value}</p>
            </div>
          )
        })}
    </div>
  )
}

export default DashboardCard
