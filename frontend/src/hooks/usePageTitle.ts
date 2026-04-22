import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/': 'Home | NGA Inversiones',
  '/mercado': 'Mercado en Vivo | NGA Inversiones',
  '/nosotros': 'Sobre Nosotros | NGA Inversiones',
  '/contacto': 'Contacto | NGA Inversiones',
  '/calculadora': 'Calculadora Financiera | NGA Inversiones',
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const title = titles[location.pathname] || 'NGA Inversiones';
    document.title = title;
  }, [location]);
};
