"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export const Contact = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('/api/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setStatus('success');
        setFormData({ nombre: '', email: '', mensaje: '' });
      } else {
        throw new Error("Error sending message");
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start space-x-6 group hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Llámanos</p>
              <p className="text-lg font-black text-slate-900">+54 9 341 425-8974</p>
              <p className="text-sm text-slate-500 font-medium">Lunes a Viernes, 10:00 - 16:00</p>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start space-x-6 group hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Escríbenos</p>
              <p className="text-lg font-black text-slate-900">info@ngainversiones.com.ar</p>
              <p className="text-sm text-slate-500 font-medium">Respuesta en menos de 24hs</p>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start space-x-6 group hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Oficina Central</p>
              <p className="text-lg font-black text-slate-900">Mitre 630, Rosario</p>
              <p className="text-sm text-slate-500 font-medium">Santa Fe, Argentina</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-slate-100"
      >
        {status === 'success' ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Mensaje Enviado!</h3>
            <p className="text-slate-500 font-medium mb-10">Gracias por contactarnos. Un asesor se comunicará con vos a la brevedad.</p>
            <button 
              onClick={() => setStatus('idle')}
              className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-slate-800 transition-all"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Consulta</label>
              <textarea 
                required
                rows={4}
                value={formData.mensaje}
                onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>
            <button 
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase tracking-tighter transition-all shadow-2xl shadow-blue-900/20 flex items-center justify-center group"
            >
              {status === 'loading' ? 'Enviando...' : (
                <>
                  Enviar Consulta
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
