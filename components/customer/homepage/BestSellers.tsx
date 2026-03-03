'use client'

import React, { useState } from 'react';
import { menuData } from '@/data/menuData';
import { useCart } from '@/contexts/CartContext';
import { TrendingUp, ShoppingBag, Check, Star } from 'lucide-react';
import { useIntersectionAnimation, useIntersectionAnimationList } from '@/hooks/utils/useIntersectionAnimation';
import { animationStyle } from '@/helper/animationStyle';

const BestSellers: React.FC = () => {
  const { addToCart } = useCart();
  const [addedItems, setAddedItems] = useState<Set<number | string>>(new Set());
   const bestSellers = Object.values(menuData).flatMap(items => items.filter(item => item.isBestSeller)).slice(0, 6);

  const {ref: bestSellerRef, isVisible} = useIntersectionAnimation();
  const {itemRefs, visibleItems} = useIntersectionAnimationList(bestSellers.length);

  const handleAddToCart = (item: typeof bestSellers[0]) => {
    addToCart({
      _id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category
    });
    setAddedItems(prev => new Set([...prev, item._id]));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    }, 1500);
  };

  return (
    <section id="bestsellers-section" ref={bestSellerRef} className={`py-16 lg:py-24 bg-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 ${animationStyle(isVisible).className}`}>
          <div className="inline-flex items-center gap-2 bg-brand-color-100 rounded-full px-4 py-2 mb-4">
            <TrendingUp size={18} className="text-brand-color-500" />
            <span className="text-brand-color-500 font-semibold text-sm">Most Ordered Today</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Mga Paborito ng Bayan
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            These crowd favorites keep our customers coming back for more. Try them and see why!
          </p>
        </div>
        
        {/* Best Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellers.map((item, index) => (
            <div
              key={item._id}
              ref={(el) => {itemRefs.current[index] = el}}
              className={`group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl ${animationStyle(visibleItems[index]).className}`}
              style={animationStyle(visibleItems[index]).style}
            >
              <div className="flex">
                {/* Image */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 relative overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 w-8 h-8 bg-brand-color-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    #{index + 1}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-2">{item.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-600 font-medium">4.9</span>
                      <span className="text-gray-400 text-xs">(120+)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-brand-color-500 font-bold text-lg">₱{item.price}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addedItems.has(item._id)}
                      className={`${
                        addedItems.has(item._id)
                          ? 'bg-green-500'
                          : 'bg-[#1a1a1a] hover:bg-brand-color-500'
                      } text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2`}
                    >
                      {addedItems.has(item._id) ? (
                        <>
                          <Check size={16} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Daily Special Banner */}
        <div className={`mt-12 bg-linear-to-r from-brand-color-500 to-[#ff6b35] rounded-2xl p-6 lg:p-8 text-white transform transition-all duration-700 delay-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-3">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Daily Special</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2">Inasal Combo Meal</h3>
              <p className="text-white/80 max-w-md">
                Get our signature Chicken Inasal Paa + Pecho combo with unlimited rice and soup for only ₱299!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">₱299</div>
                <div className="text-white/60 line-through text-sm">₱388</div>
              </div>
              <button 
                onClick={() => handleAddToCart(bestSellers[2])}
                className="bg-white text-brand-color-500 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
