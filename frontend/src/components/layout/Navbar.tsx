import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Shield, Zap, Globe, PieChart, Users } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Mercado', path: '/mercado' },
    { name: 'Nosotros', path: '/nosotros' },
  ];

  return (
    <nav className={`fixed w-full z-[100] transition-all duration-500 ${
      scrolled ? 'py-4 bg-white/80 backdrop-blur-2xl shadow-sm border-b border-slate-100' : 'py-8 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-1 rounded-lg shadow-sm border border-slate-100"
            >
              <img 
                src="https://scontent.fros8-1.fna.fbcdn.net/v/t39.30808-1/348431323_258445666706358_5973766118846707652_n.png?stp=dst-png_s480x480&_nc_cat=100&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=PI5x27eGtI0Q7kNvwF7gFUP&_nc_oc=Ado3rEVCgpcgP6KmNcpmvCzG4qkdOpz8d9cYU__Y1eqkFfOPZDrJAzg5Qh6o-WQOCIM&_nc_zt=24&_nc_ht=scontent.fros8-1.fna&_nc_gid=CGMvebRBQnVGOohCS7TzQg&_nc_ss=7a389&oh=00_Af14abOXDVaVNW84P_WteJCsVf5VNhy0XBJAYEg908RCtQ&oe=69EC25AB" 
                alt="NGA Logo" 
                className="h-9 w-auto object-contain"
              />
            </motion.div>
            <span className={`ml-4 text-2xl font-black tracking-tighter ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>NGA <span className="text-blue-600">.</span></span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all relative group overflow-hidden ${
                  location.pathname === link.path ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="relative z-10">{link.name}</span>
                {location.pathname === link.path && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-blue-50 -z-0 rounded-xl"
                  />
                )}
              </Link>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-6" />
            <Link to="/contacto" className="relative group overflow-hidden bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 hover:bg-blue-700">
              <span className="relative z-10 flex items-center">
                Contáctanos
              </span>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-xl">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-8 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 text-lg font-black text-slate-700"
                >
                  {link.name}
                  <ArrowRight size={18} className="text-blue-600" />
                </Link>
              ))}
              <Link 
                to="/contacto" 
                onClick={() => setIsOpen(false)}
                className="block p-5 rounded-2xl bg-blue-600 text-center text-lg font-black text-white"
              >
                Contáctanos
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
