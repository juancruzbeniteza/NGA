import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronRight, Phone } from 'lucide-react';

const FAQ = [
  { q: '¿Cómo puedo empezar a operar?', a: 'Podés comenzar registrándote en nuestra plataforma o visitando nuestras oficinas en Rosario.' },
  { q: '¿Qué requisitos necesito?', a: 'Solo necesitás tu DNI y ser mayor de 18 años para operar en el mercado local.' },
  { q: '¿Es seguro operar con NGA?', a: 'Contamos con 65 años de trayectoria y cumplimos con todas las regulaciones de seguridad financiera en Argentina.' },
  { q: '¿Dónde están ubicados?', a: 'Nuestra sede central está en Mitre 630, en el distrito financiero de Rosario, Santa Fe.' }
];

const KNOWLEDGE_BASE = [
  { keywords: ['hola', 'buen', 'dias', 'tardes', 'noches'], response: '¡Hola! Bienvenido a NGA Inversiones. ¿En qué puedo asesorarte hoy?' },
  { keywords: ['dolar', 'blue', 'cotizacion', 'precio', 'cambio'], response: 'Podes ver todas nuestras cotizaciones en tiempo real en la pestaña "Mercado". Actualmente operamos Dólar Blue, Euro y Real.' },
  { keywords: ['bono', 'al30', 'gd30', 'renta fija'], response: 'Operamos toda la curva de bonos soberanos y corporativos. AL30 y GD30 son los más transaccionados por nuestros clientes.' },
  { keywords: ['accion', 'merval', 'ggal', 'ypf'], response: 'Brindamos acceso directo al mercado de acciones líderes y panel general. También operamos CEDEARs.' },
  { keywords: ['requisito', 'cuenta', 'abrir', 'dni'], response: 'Para abrir cuenta solo necesitás tu DNI. El proceso es 100% digital o presencial en nuestras oficinas.' },
  { keywords: ['direccion', 'donde', 'ubicacion', 'mitre', 'rosario'], response: 'Estamos en Mitre 630, Rosario. Atendemos de Lunes a Viernes de 10:00 a 16:00hs.' },
  { keywords: ['transferencia', 'deposito', 'retiro', 'plazo'], response: 'Las liquidaciones se realizan en los plazos de mercado (Contado Inmediato o 24/48hs). Trabajamos con transferencias bancarias inmediatas.' },
  { keywords: ['gracias', 'chau', 'saludos'], response: '¡De nada! Quedo a tu disposición. Si necesitás hablar con un asesor humano, hacé clic en el botón de WhatsApp.' }
];

export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'faq' | 'chat'>('faq');
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string, showWA?: boolean}[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente virtual de NGA. ¿Tenés alguna consulta sobre nuestros servicios o mercado?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findResponse = (input: string) => {
    const text = input.toLowerCase().trim();
    
    // 1. Check direct FAQ matches (case insensitive)
    const faqMatch = FAQ.find(f => f.q.toLowerCase() === text);
    if (faqMatch) return faqMatch.a;

    // 2. Check Knowledge Base keywords
    const entry = KNOWLEDGE_BASE.find(item => 
      item.keywords.some(keyword => text.includes(keyword))
    );
    if (entry) return entry.response;

    // 3. Default fallback
    return 'No estoy seguro de entender tu consulta, pero un asesor humano puede ayudarte ahora mismo por WhatsApp.';
  };

  const handleSend = (text: string = userInput) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    
    const userMsg = { role: 'user' as const, text: trimmedText };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setMode('chat');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const botResponse = findResponse(trimmedText);
      const isFallback = botResponse.includes('asesor humano');
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: botResponse,
        showWA: isFallback || prev.length > 5 // Show WhatsApp if failed or long convo
      }]);
      setIsTyping(false);
    }, 800);
  };

  const openWhatsApp = (msg: string = '') => {
    const text = msg ? `Hola, tengo una consulta: ${msg}` : 'Hola, vengo desde la web y quisiera asesoramiento.';
    window.open(`https://wa.me/5493414258974?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-24 right-0 w-[350px] md:w-[420px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-blue-600 p-8 text-white">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight text-lg uppercase italic leading-none mb-1">NGA Assistant</h3>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">En línea ahora</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#F8FAFC]"
            >
              {mode === 'faq' ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Preguntas Frecuentes</p>
                  {FAQ.map((f, i) => (
                    <motion.button 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSend(f.q)}
                      className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all flex justify-between items-center group"
                    >
                      <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{f.q}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                    </motion.button>
                  ))}
                  <button 
                    onClick={() => setMode('chat')}
                    className="w-full py-4 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 rounded-2xl transition-all"
                  >
                    O escribí tu consulta personalizada
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%] flex flex-col space-y-2">
                        <div className={`p-4 rounded-2xl text-sm font-bold leading-relaxed ${
                          m.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/10 italic' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                        }`}>
                          {m.text}
                        </div>
                        {m.showWA && (
                          <button 
                            onClick={() => openWhatsApp(messages[messages.length-2]?.text)}
                            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black uppercase italic text-[10px] tracking-tighter hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 self-start"
                          >
                            <Phone size={12} />
                            <span>Hablar por WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((d) => (
                            <motion.div 
                              key={d}
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.2 }}
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribí tu consulta..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 px-3 outline-none"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!userInput.trim() || isTyping}
                  className="w-10 h-10 bg-blue-600 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 md:w-20 md:h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 relative ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-4 border-white rounded-full flex items-center justify-center text-[10px] font-black text-white">1</span>
        )}
      </motion.button>
    </div>
  );
};
