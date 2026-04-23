"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Euro, Banknote, RefreshCcw, TrendingUp } from 'lucide-react';

interface Quote {
  compra: number;
  venta: number;
}

interface QuotesData {
  dolar: Quote;
  euro: Quote;
  real: Quote;
}

const QuoteCard = ({ title, data, icon: Icon, color }: { title: string, data: Quote | null, icon: any, color: string }) => {
  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color}`}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-10 ')}`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <TrendingUp size={14} />
          <span className="text-xs font-bold">En vivo</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Precio de Venta</p>
          <p className="text-4xl font-black text-slate-900">
            {data ? formatter.format(data.venta) : '---'}
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Compra</p>
            <p className="text-lg font-bold text-slate-700">{data ? formatter.format(data.compra) : '---'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-bold">Variación</p>
            <p className="text-sm font-bold text-emerald-600">+0.25%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const API_URL = ''; // Relative path for Next.js API routes

export const Quotes = () => {
  const [quotes, setQuotes] = useState<QuotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quotes`);
      setQuotes(response.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Fallback to dummy data if server is not up yet during development
      setQuotes({
        dolar: { compra: 980, venta: 1000 },
        euro: { compra: 1050, venta: 1080 },
        real: { compra: 190, venta: 200 }
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="cotizaciones" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Mercado de Divisas</h2>
            <p className="text-slate-500 max-w-xl">
              Accedé a las mejores cotizaciones del mercado en tiempo real. Actualizamos nuestros precios minuto a minuto para brindarte la mejor información.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-gray-100">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Última actualización: {lastUpdate || 'Cargando...'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <QuoteCard title="Dólar Blue" data={quotes?.dolar || null} icon={DollarSign} color="bg-blue-600" />
          <QuoteCard title="Euro" data={quotes?.euro || null} icon={Euro} color="bg-indigo-600" />
          <QuoteCard title="Real Brasileño" data={quotes?.real || null} icon={Banknote} color="bg-emerald-600" />
        </div>
      </div>
    </section>
  );
};
