import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ChevronRight, CheckCircle2, AlertCircle, Clock, RefreshCcw } from 'lucide-react';

export const Contact = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', mensaje: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('http://localhost:5023/api/contact', formData);
      setTimeout(() => {
        setStatus('success');
        setFormData({ nombre: '', email: '', mensaje: '' });
      }, 1000);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-900 rounded-[4rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
            {/* Info Panel */}
            <div className="lg:col-span-5 p-12 lg:p-24 text-white">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl lg:text-7xl font-black mb-10 leading-[0.9] tracking-tighter">
                  Conectemos <br /> <span className="text-blue-500 italic">Hoy.</span>
                </h2>
                <p className="text-slate-400 text-xl mb-16 leading-relaxed font-medium">
                  Nuestros asesores senior están listos para diseñar una estrategia a la medida de tu patrimonio.
                </p>
                
                <div className="space-y-10">
                  {[
                    { icon: Phone, label: 'Línea Directa', val: '+54 9 341 425-8974', color: 'text-emerald-400' },
                    { icon: Mail, label: 'Email Institucional', val: 'consultas@nga.com', color: 'text-blue-400' },
                    { icon: Clock, label: 'Atención', val: 'Lun a Vie, 10:00 - 16:00hs', color: 'text-amber-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-6 group">
                      <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                        <item.icon className={item.color + " group-hover:text-white transition-colors"} size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{item.label}</p>
                        <p className="text-xl font-bold tracking-tight">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-7 p-8 lg:p-24 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-blue-500">Nombre</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] py-5 px-8 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-blue-500">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] py-5 px-8 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                      placeholder="tu@dominio.com"
                    />
                  </div>
                </div>
                
                <div className="relative group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-blue-500">Consulta</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-[2rem] py-6 px-8 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10 resize-none"
                    placeholder="¿Cómo podemos potenciar tu inversión?"
                  />
                </div>
                
                <div className="relative">
                  <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="w-full relative group overflow-hidden bg-blue-600 disabled:bg-slate-800 text-white font-black py-5 md:py-6 rounded-[2rem] text-lg md:text-xl transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center"
                  >
                    <AnimatePresence mode="wait">
                      {status === 'loading' ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <RefreshCcw className="animate-spin-slow" size={24} />
                        </motion.div>
                      ) : status === 'success' ? (
                        <motion.div key="success" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center space-x-3">
                          <CheckCircle2 size={24} />
                          <span>Mensaje Enviado</span>
                        </motion.div>
                      ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3">
                          <span>Enviar Consulta</span>
                          <ChevronRight className="group-hover:translate-x-2 transition-transform" size={24} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

                {status === 'error' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 text-red-400 justify-center font-bold uppercase text-xs tracking-widest">
                    <AlertCircle size={16} />
                    <span>Error al enviar. Intente más tarde.</span>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
