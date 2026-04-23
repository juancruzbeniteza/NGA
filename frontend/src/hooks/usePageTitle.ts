import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title: string;
  description: string;
}

const seoConfig: Record<string, SEOData> = {
  '/': {
    title: 'NGA Inversiones | Estrategias de Inversión y Cambio en Rosario',
    description: 'NGA Inversiones: 65 años de trayectoria en el mercado financiero argentino. Cotizaciones en vivo de Dólar Blue, Bonos y Acciones del Merval. Asesoramiento en Rosario.',
  },
  '/mercado': {
    title: 'Mercado Argentino en Vivo: Dólar, Bonos y Acciones | NGA Inversiones',
    description: 'Monitoreá el pulso del mercado financiero en tiempo real. Cotizaciones actualizadas de Dólar Blue, Euro, Real, bonos soberanos (AL30, GD30) y líderes del Merval.',
  },
  '/nosotros': {
    title: 'Nuestra Trayectoria: 65 Años de Solidez | NGA Inversiones',
    description: 'Conocé la historia de NGA Inversiones. Desde Rosario para toda Argentina, marcando el rumbo con transparencia, seguridad y expertise financiero comprobado.',
  },
  '/contacto': {
    title: 'Contactá a un Asesor Financiero en Rosario | NGA Inversiones',
    description: 'Operá de manera directa y segura. Contactá a nuestros asesores en Rosario, Santa Fe para gestionar tus inversiones en divisas, renta fija y variable.',
  },
  '/calculadora': {
    title: 'Calculadora Financiera de Retornos | NGA Inversiones',
    description: 'Proyectá el crecimiento de tu capital. Utilizá nuestra calculadora financiera para estimar retornos de inversión basados en tasas de interés actuales.',
  }
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const config = seoConfig[location.pathname] || seoConfig['/'];
    
    // Update Title
    document.title = config.title;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', config.description);

    // Update Open Graph tags for social sharing preview
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', config.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', config.description);
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', config.title);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', config.description);

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute('href', `https://ngainversiones.com${location.pathname}`);
    }

  }, [location.pathname]);
};
