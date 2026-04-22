import { motion } from 'framer-motion';
import { Landmark, Users, History, CheckCircle2, MapPin, Phone } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-32 pb-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-blue-600/10 text-blue-700 px-4 py-2 rounded-full mb-8"
          >
            <History size={16} />
            <span className="text-xs font-black uppercase tracking-widest italic">Nuestra Historia</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]"
          >
            65 Años de <br /> <span className="text-blue-600 italic">Trayectoria Local.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-xl text-slate-500 font-medium leading-relaxed"
          >
            Desde 1960, NGA Inversiones ha sido un pilar en el mercado financiero de Rosario, acompañando a tres generaciones de inversores con transparencia y solidez.
          </motion.p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Valores que definen <br /> nuestra identidad.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              No somos simplemente una plataforma digital; somos una institución con raíces profundas en Santa Fe. Nuestra misión es democratizar el acceso a instrumentos financieros complejos de forma simple y segura.
            </p>
            <div className="space-y-6">
              {[
                { title: 'Transparencia Total', desc: 'Reportes claros y cotizaciones en tiempo real sin costos ocultos.', icon: CheckCircle2 },
                { title: 'Capital Argentino', desc: 'Entendemos la dinámica local porque operamos desde el corazón del país.', icon: Landmark },
                { title: 'Atención Humana', desc: 'Nuestro equipo técnico está siempre disponible para resolver tus dudas operativas.', icon: Users }
              ].map((val, i) => (
                <div key={i} className="flex items-start space-x-6 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <val.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">{val.title}</h4>
                    <p className="text-slate-500 text-sm font-medium">{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-blue-600 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-200 relative">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Landmark size={120} className="text-white/20" />
               </div>
               <div className="absolute bottom-10 left-10 text-white">
                  <p className="text-6xl font-black italic tracking-tighter leading-[0.8] mb-4">1960</p>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60 italic">Fundada en Rosario</p>
               </div>
            </div>
            {/* Decorative dot grid */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[radial-gradient(#2563eb_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 -z-10" />
          </motion.div>
        </div>

        {/* Location Section */}
        <div className="bg-slate-900 rounded-[4rem] p-12 lg:p-24 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl lg:text-6xl font-black mb-8 italic tracking-tighter uppercase leading-[0.9]">Visitanos en <br /> <span className="text-blue-500">Rosario.</span></h3>
              <p className="text-slate-400 text-xl font-medium mb-12 max-w-md leading-relaxed">
                Nuestra oficina central se encuentra en el distrito financiero de Rosario, brindando seguridad y respaldo físico a cada una de tus operaciones.
              </p>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                   <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-blue-400">
                      <MapPin size={20} />
                   </div>
                   <span className="font-bold text-lg">Mitre 630, Rosario, Santa Fe</span>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-blue-400">
                      <Phone size={20} />
                   </div>
                   <span className="font-bold text-lg">+54 9 341 425-8974</span>
                </div>
              </div>
            </div>
            <div className="h-96 w-full bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
               <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.164843054176!2d-60.64167382431771!3d-32.94660307359336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b7ab1df8434771%3A0x6334969b76c026!2sMitre%20630%2C%20S2000%20Rosario%2C%20Santa%20Fe!5e0!3m2!1ses-419!2sar!4v1713800000000!5m2!1ses-419!2sar" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="opacity-80 hover:opacity-100 transition-opacity duration-500"
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
