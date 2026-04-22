import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronRight } from 'lucide-react';

const FAQ = [
  { q: '¿Cómo puedo empezar a operar?', a: 'Podés comenzar registrándote en nuestra plataforma o visitando nuestras oficinas en Rosario.' },
  { q: '¿Qué requisitos necesito?', a: 'Solo necesitás tu DNI y ser mayor de 18 años para operar en el mercado local.' },
  { q: '¿Es seguro operar con NGA?', a: 'Contamos con 65 años de trayectoria y cumplimos con todas las regulaciones de seguridad financiera en Argentina.' },
  { q: '¿Dónde están ubicados?', a: 'Nuestra sede central está en el distrito financiero de Rosario, Santa Fe.' }
];

export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setMode] = useState<'faq' | 'chat'>('faq');
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string}[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente de NGA Inversiones. ¿En qué puedo ayudarte?' }
  ]);
  const [userInput, setUserInput] = useState('');

  const handleSend = () => {
    if (!userInput.trim()) return;
    const newMsgs = [...messages, { role: 'user' as const, text: userInput }];
    setMessages(newMsgs);
    setUserInput('');
    
    setTimeout(() => {
      setMessages([...newMsgs, { role: 'bot', text: 'Entendido. Te redirijo a nuestro canal oficial de WhatsApp para una atención directa y segura.' }]);
      setTimeout(() => {
        window.open(`https://wa.me/5493414258974?text=Hola, tengo una consulta desde la web: ${userInput}`, '_blank');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-24 right-0 w-[350px] md:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-600 p-8 text-white relative">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight text-lg uppercase italic">NGA Soporte</h3>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Respuesta Inmediata</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[350px] overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#F8FAFC]">
              {step === 'faq' ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ayuda Rápida</p>
                  {FAQ.map((f, i) => (
                    <motion.button 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                        setMessages([...messages, { role: 'user', text: f.q }, { role: 'bot', text: f.a }]);
                        setMode('chat');
                      }}
                      className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all flex justify-between items-center"
                    >
                      <span className="font-bold text-slate-700 text-sm">{f.q}</span>
                      <ChevronRight size={14} className="text-blue-600" />
                    </motion.button>
                  ))}
                  <button 
                    onClick={() => setMode('chat')}
                    className="w-full py-4 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    O escribí tu consulta
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                        m.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                      }`}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            {step === 'chat' && (
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Tu mensaje..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 px-3 outline-none"
                  />
                  <button 
                    onClick={handleSend}
                    className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full animate-bounce" />
        )}
      </motion.button>
    </div>
  );
};
