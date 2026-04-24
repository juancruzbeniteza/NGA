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
        const res = await axios.get('/api/quotes');
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
    { label: 'DÓLAR', value: data.dolar?.venta ? `$${data.dolar.venta}` : '...', up: true },
    { label: 'EURO', value: data.euro?.venta ? `$${data.euro.venta}` : '...', up: true },
    { label: 'REAL', value: data.real?.venta ? `$${data.real.venta}` : '...', up: false },
    ...(data.stocks?.slice(0, 10).map((s: any) => ({
      label: s.symbol,
      value: `${s.pct_change > 0 ? '+' : ''}${s.pct_change}%`,
      up: s.pct_change >= 0
    })) || [])
  ];

  // Double items to create seamless loop
  const tickerItems = [...items, ...items];

  return (
    <div className="bg-slate-950 border-b border-white/5 py-3 overflow-hidden whitespace-nowrap relative z-[110] backdrop-blur-md">
      <motion.div 
        animate={{ x: [0, -2000] }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="inline-flex space-x-16"
      >
        {tickerItems.map((item, i) => (
          <div key={i} className="flex items-center space-x-4 group cursor-default">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">{item.label}</span>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black text-white tabular-nums tracking-tighter">{item.value}</span>
              <div className={`p-1 rounded-md ${item.up ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {item.up ? (
                  <TrendingUp size={10} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={10} className="text-red-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
