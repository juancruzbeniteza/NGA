import React from 'react';
import { Calculator } from '../components/Calculator';

export const CalculatorPage = () => (
  <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight">Calculadora de Operaciones</h1>
        <p className="text-xl text-slate-500">
          Herramienta de simulación para que sepas exactamente cuánto recibirás en tus operaciones de cambio.
        </p>
      </div>
      <Calculator />
    </div>
  </div>
);
