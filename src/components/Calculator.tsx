"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RefreshCcw, Wallet, TrendingUp, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

interface Quote {
  compra: number;
  venta: number;
}

interface QuotesData {
  dolar: Quote;
  euro: Quote;
  real: Quote;
  last_update?: string;
}

export const Calculator = () => {
  const [mode, setMode] = useState<'compra' | 'venta'>('compra');
  const [amount, setAmount] = useState<number>(100000);
  const [currency, setCurrency] = useState<'dolar' | 'euro' | 'real'>('dolar');
  const [quotes, setQuotes] = useState<QuotesData | null>(null);
  const [result, setResult] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await axios.get<QuotesData>('/api/quotes');
        setQuotes(response.data);
      } catch {
        setQuotes({
          dolar: { compra: 1390, venta: 1410 },
          euro: { compra: 1611, venta: 1625 },
          real: { compra: 276, venta: 277 }
        });
      }
    };
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (!quotes) return;
    
    // Use a small delay to avoid cascading render warning while starting animation
    const animationStart = setTimeout(() => setIsAnimating(true), 0);
    
    const rate = quotes[currency];
    const calc = mode === 'compra' ? amount / rate.venta : amount * rate.compra;
    
    const timeout = setTimeout(() => {
      setResult(calc);
      setIsAnimating(false);
    }, 150);
    return () => {
      clearTimeout(animationStart);
      clearTimeout(timeout);
    };
  }, [amount, currency, mode, quotes]);

  const currencyNames = { dolar: 'Dólar Blue', euro: 'Euro Oficial', real: 'Real' };
  const currencyCodes = { dolar: 'USD', euro: 'EUR', real: 'BRL' };

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-[2.5rem] p-1 shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-0">
            {/* Input Side */}
            <div className="lg:col-span-7 p-8 md:p-12 lg:p-16">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Simulador</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Mercado en Tiempo Real</p>
                  </div>
                </div>
                {quotes?.last_update && (
                  <div className="hidden sm:flex items-center space-x-2 text-slate-400">
                    <RefreshCcw size={12} className="animate-spin-slow" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(quotes.last_update).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-12 max-w-sm">
                <button
                  onClick={() => setMode('compra')}
                  className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    mode === 'compra' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Comprar
                </button>
                <button
                  onClick={() => setMode('venta')}
                  className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    mode === 'venta' ? 'bg-white text-blue-600 shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Vender
                </button>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <label className="absolute -top-2.5 left-6 px-2 bg-white text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] z-10">
                    Monto a {mode === 'compra' ? 'Invertir' : 'Cambiar'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-6 px-8 text-3xl font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-200"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                      <span className="text-lg font-black text-slate-300 tracking-tighter">{mode === 'compra' ? 'ARS' : currencyCodes[currency]}</span>
                      <div className="w-px h-8 bg-slate-200" />
                      <Wallet className="text-slate-300" size={20} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['dolar', 'euro', 'real'] as const).map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur)}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center relative overflow-hidden group ${
                        currency === cur 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100' 
                          : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 ${currency === cur ? 'text-blue-600' : 'text-slate-400'}`}>
                        {currencyCodes[cur]}
                      </span>
                      <span className="font-black text-sm text-slate-900 uppercase italic tracking-tight">{currencyNames[cur]}</span>
                      {currency === cur && (
                        <motion.div layoutId="activeCur" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Side */}
            <div className="lg:col-span-5 bg-slate-900 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden rounded-[2rem] m-3">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px] -mr-40 -mt-40" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -ml-32 -mb-32" />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 text-blue-400 mb-12">
                  <div className="p-2 bg-blue-400/10 rounded-lg">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cálculo Neto</span>
                </div>

                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-4">
                  {mode === 'compra' ? 'Recibirías en mano:' : 'Pesos a Acreditar:'}
                </p>

                <motion.div 
                  animate={{ scale: isAnimating ? 0.98 : 1, opacity: isAnimating ? 0.8 : 1 }}
                  className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-10 italic"
                >
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: mode === 'compra' ? currencyCodes[currency] : 'ARS',
                    maximumFractionDigits: 2
                  }).format(result)}
                </motion.div>

                <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 text-white/80">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Punta {mode === 'compra' ? 'Venta' : 'Compra'}: $ {quotes ? (mode === 'compra' ? quotes[currency].venta : quotes[currency].compra) : '...'}
                  </span>
                </div>
              </div>

              <div className="relative z-10 mt-12">
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-900/50 flex items-center justify-center group uppercase italic tracking-tighter">
                  Solicitar Operación
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={20} />
                </button>
                
                <div className="flex items-center justify-center space-x-2 mt-8 text-slate-500">
                  <ShieldCheck size={14} className="text-blue-500/50" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Liquidación Inmediata Protegida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
