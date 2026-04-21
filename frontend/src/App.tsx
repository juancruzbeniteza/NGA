import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Market } from './pages/Market';
import About from './pages/About';
import { ContactPage } from './pages/ContactPage';
import { ChatAssistant } from './components/ChatAssistant';
import { motion, AnimatePresence } from 'framer-motion';

// Calculator is commented out as requested
// import { CalculatorPage } from './pages/CalculatorPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
        <Navbar />
        <main className="relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mercado" element={<Market />} />
              <Route path="/nosotros" element={<About />} />
              {/* <Route path="/calculadora" element={<CalculatorPage />} /> */}
              <Route path="/contacto" element={<ContactPage />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        <ChatAssistant />
      </div>
    </Router>
  );
}
