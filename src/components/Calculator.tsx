"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Wallet, TrendingUp, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

export const Calculator = () => {
  const [mode, setMode] = useState<'compra' | 'venta'>('compra');
  const [amount, setAmount] = useState<number>(100000);
  const [currency, setCurrency] = useState<'dolar' | 'euro' | 'real'>('dolar');
  const [quotes, setQuotes] = useState<any>(null);
  const [result, setResult] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes');
        const data = await res.json();
        setQuotes(data);
      } catch (e) {
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
    setIsAnimating(true);
    const rate = quotes[currency];
    const calc = mode === 'compra' ? amount / rate.venta : amount * rate.compra;
    
    const timeout = setTimeout(() => {
      setResult(calc);
      setIsAnimating(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [amount, currency, mode, quotes]);

  const currencyNames = { dolar: 'Dólar Blue', euro: 'Euro Oficial', real: 'Real' };
  const currencyCodes = { dolar: 'USD', euro: 'EUR', real: 'BRL' };

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-[3.5rem] p-1 shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-0">
            {/* Input Side */}
            <div className="lg:col-span-7 p-10 md:p-16">
              <div className="flex items-center space-x-4 mb-12">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                  <Landmark size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Simulador</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Operaciones en Tiempo Real</p>
                </div>
              </div>

              <div className="flex p-1.5 bg-slate-100 rounded-[2rem] mb-12 max-w-md">
                <button
                  onClick={() => setMode('compra')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                    mode === 'compra' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Comprar
                </button>
                <button
                  onClick={() => setMode('venta')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                    mode === 'venta' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Vender
                </button>
              </div>

              <div className="space-y-10">
                <div className="relative group">
                  <label className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] z-10 transition-all group-focus-within:text-slate-900">
                    Monto a {mode === 'compra' ? 'Invertir' : 'Cambiar'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-8 px-8 text-4xl font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <span className="text-xl font-black text-slate-300">{mode === 'compra' ? 'ARS' : currencyCodes[currency]}</span>
                      <Wallet className="text-slate-200" size={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['dolar', 'euro', 'real'] as const).map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group ${
                        currency === cur 
                          ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-900/5' 
                          : 'border-slate-100 bg-white hover:border-blue-200'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${currency === cur ? 'text-blue-600' : 'text-slate-400'}`}>
                        {currencyCodes[cur]}
                      </span>
                      <span className="font-bold text-slate-900">{currencyNames[cur]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Side */}
            <div className="lg:col-span-5 bg-slate-900 p-10 md:p-16 flex flex-col justify-between relative overflow-hidden rounded-[3rem] m-2">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -ml-24 -mb-24" />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 text-blue-400 mb-10">
                  <TrendingUp size={20} />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Cálculo Estimado</span>
                </div>

                <p className="text-slate-400 font-medium text-lg mb-4">
                  {mode === 'compra' ? 'Recibirías en tu cuenta:' : 'Te acreditamos en Pesos:'}
                </p>

                <motion.div 
                  animate={{ scale: isAnimating ? 0.95 : 1, opacity: isAnimating ? 0.7 : 1 }}
                  className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8"
                >
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: mode === 'compra' ? currencyCodes[currency] : 'ARS',
                    maximumFractionDigits: 2
                  }).format(result)}
                </motion.div>

                <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-white/60">
                  <RefreshCcw size={14} className="animate-spin-slow" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Precio: 1 {currencyCodes[currency]} = {quotes ? (mode === 'compra' ? quotes[currency].venta : quotes[currency].compra) : '...'} ARS</span>
                </div>
              </div>

              <div className="relative z-10 mt-12">
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-blue-900/50 flex items-center justify-center group">
                  Confirmar Operación
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
                </button>
                
                <div className="flex items-center justify-center space-x-2 mt-8 text-slate-500">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Operación 100% Protegida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
