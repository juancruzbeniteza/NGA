import { Contact } from '../components/Contact';

export const ContactPage = () => (
  <div className="pt-32 pb-24 bg-white min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight">Contacto Directo</h1>
        <p className="text-xl text-slate-500">
          ¿Tenés alguna duda o necesitás asesoramiento personalizado? Ponete en contacto con nuestro equipo.
        </p>
      </div>
      <Contact />
    </div>
  </div>
);
