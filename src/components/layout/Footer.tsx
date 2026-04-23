"use client";

import { motion } from 'framer-motion';
import { MessageSquare, Mail, Globe, MapPin, ChevronRight } from 'lucide-react';
import Link from "next/link";

export const Footer = () => (
  <footer className="bg-black pt-32 pb-12 border-t border-white/5 overflow-hidden relative">
    {/* Decorative background circle */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />

    <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/" className="group flex items-center space-x-4">
              <div className="bg-white/5 p-2 rounded-xl border border-white/10 group-hover:border-blue-500/50 transition-colors">
                <img 
                  src="https://scontent.fros8-1.fna.fbcdn.net/v/t39.30808-1/348431323_258445666706358_5973766118846707652_n.png?stp=dst-png_s480x480&_nc_cat=100&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=PI5x27eGtI0Q7kNvwF7gFUP&_nc_oc=Ado3rEVCgpcgP6KmNcpmvCzG4qkdOpz8d9cYU__Y1eqkFfOPZDrJAzg5Qh6o-WQOCIM&_nc_zt=24&_nc_ht=scontent.fros8-1.fna&_nc_gid=CGMvebRBQnVGOohCS7TzQg&_nc_ss=7a389&oh=00_Af14abOXDVaVNW84P_WteJCsVf5VNhy0XBJAYEg908RCtQ&oe=69EC25AB" 
                  className="h-10 w-auto invert grayscale brightness-200" 
                  alt="Logo" 
                />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">NGA Inversiones</span>
            </Link>
          </div>
          <p className="text-slate-500 text-lg leading-relaxed max-w-sm mb-10 font-medium tracking-tight">
            Seis décadas marcando el rumbo financiero desde Rosario hacia toda la República Argentina con solidez y transparencia absoluta.
          </p>
          <div className="flex space-x-4">
            {[MapPin, Mail, MessageSquare].map((Icon, i) => (
              <motion.a 
                key={i}
                whileHover={{ y: -5, scale: 1.1, color: '#2563eb' }}
                href="#" 
                className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 transition-all hover:border-blue-500/30"
              >
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8">Navegación</h4>
          <ul className="space-y-4">
            {[
              { name: 'Inicio', path: '/' },
              { name: 'Mercado', path: '/mercado' },
              { name: 'Nosotros', path: '/nosotros' },
              { name: 'Contacto', path: '/contacto' }
            ].map((link) => (
              <li key={link.name}>
                <Link href={link.path} className="text-slate-400 hover:text-blue-500 font-bold flex items-center group transition-colors uppercase italic text-sm tracking-tighter">
                  <ChevronRight size={14} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8">Oficina Central</h4>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Globe className="text-blue-500 mt-1 shrink-0" size={18} />
              <p className="text-slate-300 font-bold leading-tight uppercase italic tracking-tighter">Rosario, Santa Fe <br /> <span className="text-slate-500 font-medium normal-case">República Argentina</span></p>
            </div>
            <p className="text-slate-500 text-xs font-medium tracking-tight">
              Cumpliendo con los máximos estándares de seguridad y regulación del mercado argentino.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          © 2026 NGA INVERSIONES <span className="mx-2 opacity-20">|</span> <span className="text-slate-700">SOLIDEZ • TRAYECTORIA • FUTURO</span>
        </p>
        <div className="flex items-center space-x-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Términos</a>
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Compliance</a>
        </div>
      </div>
    </div>
  </footer>
);
