"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MarketTicker = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('http://localhost:5023/api/quotes');
        setData(res.data);
      } catch (e) {
        // Fallback for visual purposes
        setData({
          dolar: { compra: 1390, venta: 1410 },
          euro: { compra: 1611, venta: 1625 },
          real: { compra: 276, venta: 277 },
          stocks: [
            { ticker: "GGAL", variacion: "+2.4%" },
            { ticker: "YPFD", variacion: "-1.2%" },
            { ticker: "PAMP", variacion: "+0.8%" }
          ]
        });
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const items = [
    { label: 'USD/ARS', value: data.dolar.venta, up: true },
    { label: 'EUR/ARS', value: data.euro.venta, up: true },
    { label: 'BRL/ARS', value: data.real.venta, up: false },
    ...(data.stocks?.map((s: any) => ({
      label: s.ticker,
      value: s.variacion,
      up: s.variacion.startsWith('+')
    })) || [])
  ];

  // Double items to create seamless loop
  const tickerItems = [...items, ...items, ...items];

  return (
    <div className="bg-slate-900 border-b border-white/5 py-2 overflow-hidden whitespace-nowrap relative z-[110]">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="inline-flex space-x-12 px-12"
      >
        {tickerItems.map((item, i) => (
          <div key={i} className="flex items-center space-x-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
            <span className="text-[11px] font-bold text-white tabular-nums">{typeof item.value === 'number' ? `$${item.value}` : item.value}</span>
            {item.up ? (
              <TrendingUp size={10} className="text-emerald-500" />
            ) : (
              <TrendingDown size={10} className="text-red-500" />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
