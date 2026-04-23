"use client";

import { Calculator } from "@/components/Calculator";
import { motion } from "framer-motion";

export default function CalculatorPage() {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 uppercase italic"
          >
            Calculadora <span className="text-blue-600">Financiera.</span>
          </motion.h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Simulá tus operaciones con las cotizaciones reales del mercado. Transparencia total antes de operar.
          </p>
        </div>
        <Calculator />
      </div>
    </div>
  );
}
