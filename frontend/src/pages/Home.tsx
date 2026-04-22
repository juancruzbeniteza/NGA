import { motion } from 'framer-motion';
import { ArrowRight, Landmark, ArrowUpRight, BarChart3, Zap, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackgroundShaders } from '../components/ui/Shaders';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      duration: 0.8, 
      ease: "circOut" 
    } 
  }
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F8FAFC] py-20">
      <BackgroundShaders />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full text-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col items-center"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-blue-600/5 text-blue-600 px-6 py-2.5 rounded-full mb-12 border border-blue-600/10 backdrop-blur-xl shadow-sm"
          >
            <Zap size={12} className="animate-pulse" />
            <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase italic">Operativa Directa • Rosario</span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl lg:text-[10rem] font-black text-slate-900 tracking-tighter mb-10 leading-[0.8] md:leading-[0.85] uppercase italic"
          >
            Evolución <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              Financiera.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="max-w-2xl text-lg md:text-2xl text-slate-500 mb-16 leading-relaxed font-medium tracking-tight"
          >
            Más de 65 años de solidez en el mercado argentino. Accedé a cotizaciones en tiempo real, bonos y acciones con transparencia total.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
          >
            <Link to="/contacto" className="group relative w-full sm:w-80 bg-blue-600 text-white py-6 rounded-[2.5rem] text-lg md:text-xl font-black italic uppercase tracking-tighter hover:bg-blue-700 transition-all flex items-center justify-center shadow-2xl shadow-blue-100 overflow-hidden">
              <span className="relative z-10 flex items-center">
                Operar Ahora
                <ArrowUpRight className="ml-3 group-hover:rotate-45 transition-transform duration-500" size={24} />
              </span>
              <motion.div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            
            <Link to="/mercado" className="w-full sm:w-auto flex items-center justify-center space-x-3 px-10 py-6 text-lg md:text-xl font-black uppercase italic tracking-tighter text-slate-700 hover:text-blue-600 transition-all group">
              <span>Mercado en Vivo</span>
              <div className="w-10 h-px bg-slate-200 group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute left-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col space-y-12 z-20"
      >
        {[
          { label: 'Blue', val: '$1.410', color: 'text-blue-600' },
          { label: 'AL30', val: '53.10', color: 'text-slate-900' },
          { label: 'GGAL', val: '4.850', color: 'text-slate-900' }
        ].map((stat, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</span>
            <span className={`text-2xl font-black italic ${stat.color}`}>{stat.val}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

const MarketInsights = () => {
  return (
    <>
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-24 gap-8">
            <div className="text-left">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl lg:text-7xl font-black text-slate-900 mb-6 tracking-tighter italic uppercase"
              >
                Pulso del <br /> <span className="text-blue-600">Mercado.</span>
              </motion.h2 >
              <p className="text-slate-500 text-xl font-medium max-w-xl">Inteligencia financiera aplicada a activos argentinos. Datos puros y ejecución directa desde nuestras oficinas.</p>
            </div>
            <Link to="/mercado" className="px-10 py-5 bg-slate-50 border border-slate-100 text-slate-900 rounded-3xl font-black uppercase italic tracking-tighter hover:bg-slate-100 transition-all">
              Explorar Tablero
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Monitor de Divisas', 
                desc: 'Seguimiento en tiempo real de los principales tipos de cambio en la City.',
                icon: BarChart3,
                delay: 0
              },
              { 
                title: 'Renta Fija', 
                desc: 'Cotizaciones actualizadas de bonos soberanos AL30, GD30 y su spread.',
                icon: Landmark,
                delay: 0.1
              },
              { 
                title: 'Lideres Merval', 
                desc: 'Panel de acciones líderes con variaciones porcentuales al instante.',
                icon: Briefcase,
                delay: 0.2
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="p-10 rounded-[3rem] bg-[#F8FAFC] border border-slate-100 hover:border-blue-600/20 hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all group"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-500 text-white">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase italic tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium text-base">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-blue-600 rounded-[4rem] p-12 md:p-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] -ml-32 -mb-32" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="max-w-xl text-center lg:text-left">
                <h3 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic leading-[0.9]">
                  Reportes de <br /> <span className="text-blue-100">Cierre Semanal.</span>
                </h3>
                <p className="text-blue-100 text-xl font-medium">Suscribite y recibí nuestro análisis exclusivo sobre el mercado cambiario y bursátil argentino todos los viernes.</p>
              </div>
              
              <div className="w-full lg:w-auto bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/20 flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico" 
                  className="bg-transparent border-none px-6 md:px-8 py-4 md:py-5 text-white placeholder:text-blue-200 focus:outline-none w-full sm:w-80 font-bold text-sm md:text-base"
                />
                <button className="bg-white text-blue-600 px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-black uppercase italic tracking-tighter hover:bg-blue-50 transition-all whitespace-nowrap text-sm md:text-base">
                  Suscribirme
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const Home = () => (
  <div className="bg-white">
    <Hero />
    <MarketInsights />
    
    {/* CTA Final */}
    <section className="py-40 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-9xl font-black mb-10 leading-[0.8] tracking-tighter uppercase italic text-white">Operá con <br /> <span className="text-blue-500">Transparencia.</span></h2>
            <p className="text-xl md:text-3xl text-slate-400 font-medium leading-tight tracking-tight">
              Seis décadas marcando el rumbo financiero desde Rosario hacia toda Argentina.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link to="/contacto" className="inline-flex w-full sm:w-auto items-center justify-center px-10 md:px-16 py-6 md:py-8 bg-blue-600 text-white rounded-[3rem] text-xl md:text-3xl font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/50 uppercase italic tracking-tighter">
              Contactar
              <ArrowRight className="ml-4 md:ml-6 text-white" size={24} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  </div>
);
