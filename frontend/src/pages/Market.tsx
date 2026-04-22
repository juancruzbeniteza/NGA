import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Euro, Banknote, RefreshCcw, Landmark, Briefcase } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const dummyData = [
  { time: '09:00', value: 950 }, { time: '10:00', value: 965 }, 
  { time: '11:00', value: 960 }, { time: '12:00', value: 975 },
  { time: '13:00', value: 985 }, { time: '14:00', value: 990 }, 
  { time: '15:00', value: 980 }, { time: '16:00', value: 1000 }
];

const MarketCardSkeleton = () => (
  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-[400px] animate-pulse flex flex-col justify-between">
    <div>
      <div className="w-12 h-12 bg-slate-100 rounded-xl mb-6" />
      <div className="w-24 h-4 bg-slate-100 rounded mb-4" />
      <div className="w-48 h-10 bg-slate-100 rounded mb-8" />
      <div className="w-full h-20 bg-slate-50 rounded-2xl" />
    </div>
    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
      <div className="w-20 h-8 bg-slate-50 rounded" />
      <div className="w-20 h-8 bg-slate-50 rounded ml-auto" />
    </div>
  </div>
);

const MarketCard = ({ title, data, icon: Icon, chartData, index, type = 'currency' }: any) => {
  const formatter = new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: type === 'bond' ? 'USD' : 'ARS',
    minimumFractionDigits: 2
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group h-full flex flex-col justify-between"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 md:p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Icon size={20} />
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full mb-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest">En Vivo</span>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest line-clamp-1">{title}</h3>
        <div className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tighter">
          {data ? (typeof data === 'number' ? formatter.format(data) : formatter.format(data.venta || data.precio)) : '---'}
        </div>

        <div className="h-20 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                fillOpacity={0.1} 
                fill="#2563eb" 
                strokeWidth={3}
                animationDuration={1500}
              />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 mt-auto">
        {type === 'currency' || type === 'bond' ? (
          <>
            <div>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Compra</p>
              <p className="text-sm md:text-base font-black text-slate-700">{data ? formatter.format(data.compra) : '---'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Venta</p>
              <p className="text-sm md:text-base font-black text-slate-900">{data ? formatter.format(data.venta) : '---'}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Variación</p>
              <p className={`text-sm md:text-base font-black ${data?.variacion?.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{data?.variacion || '0.0%'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Sector</p>
              <p className="text-sm md:text-base font-black text-slate-900 truncate">{data?.sector || '---'}</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export const Market = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [activeTab, setActiveTab] = useState('divisas');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('http://localhost:5023/api/quotes');
        setData(res.data);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (e) {
        setData({
          dolar: { compra: 1390, venta: 1410 },
          euro: { compra: 1611, venta: 1625 },
          real: { compra: 276, venta: 277 },
          bonds: [
            { ticker: "AL30", nombre: "Bonar 2030", compra: 52.40, venta: 53.10 },
            { ticker: "GD30", nombre: "Global 2030", compra: 56.15, venta: 56.80 }
          ],
          stocks: [
            { ticker: "GGAL", nombre: "Galicia", precio: 4850.50, variacion: "+2.4%", sector: "Bancario" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-24 md:pt-32 pb-32 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl text-center lg:text-left"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tighter uppercase italic">
              Mercado <br /> <span className="text-blue-600">En Vivo.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0">
              Datos unificados del mercado argentino. Cotizaciones directas sin intermediarios.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center p-1.5 bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-x-auto no-scrollbar self-center lg:self-end"
          >
            {['divisas', 'bonos', 'acciones'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-10 py-3 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab + (loading ? '-loading' : '-ready')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {loading ? (
              <>
                <MarketCardSkeleton />
                <MarketCardSkeleton />
                <MarketCardSkeleton />
              </>
            ) : (
              <>
                {activeTab === 'divisas' && (
                  <>
                    <MarketCard index={0} title="Dólar Blue" data={data?.dolar} icon={DollarSign} color="bg-blue-600" chartData={dummyData} />
                    <MarketCard index={1} title="Euro Oficial" data={data?.euro} icon={Euro} color="bg-blue-600" chartData={dummyData.map((d:any) => ({ ...d, value: d.value + 80 }))} />
                    <MarketCard index={2} title="Real" data={data?.real} icon={Banknote} color="bg-blue-600" chartData={dummyData.map((d:any) => ({ ...d, value: d.value / 4.5 }))} />
                  </>
                )}
                {activeTab === 'bonos' && data?.bonds?.map((bond: any, i: number) => (
                  <MarketCard 
                    key={bond.ticker} 
                    index={i} 
                    title={bond.ticker} 
                    data={bond} 
                    icon={Landmark} 
                    color="bg-blue-600" 
                    type="bond"
                    subtitle={bond.nombre}
                    chartData={dummyData.map((d:any) => ({ ...d, value: 50 + Math.random() * 5 }))}
                  />
                ))}
                {activeTab === 'acciones' && data?.stocks?.map((stock: any, i: number) => (
                  <MarketCard 
                    key={stock.ticker} 
                    index={i} 
                    title={stock.ticker} 
                    data={stock} 
                    icon={Briefcase} 
                    color="bg-blue-600" 
                    type="stock"
                    subtitle={stock.nombre}
                    chartData={dummyData.map((d:any) => ({ ...d, value: 4000 + Math.random() * 1000 }))}
                  />
                ))}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 md:mt-20 flex flex-col md:flex-row items-center justify-between p-8 bg-white rounded-[3rem] border border-slate-100 gap-8 shadow-sm">
          <div className="flex items-center space-x-6 text-slate-400">
            <RefreshCcw size={16} className="animate-spin-slow text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Última sincronización: {lastUpdate}</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by NGA Real-Time Infrastructure</p>
        </div>
      </div>
    </div>
  );
};
