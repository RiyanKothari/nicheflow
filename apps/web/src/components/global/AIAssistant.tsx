import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/data';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<{role: 'user' | 'agent', content: string}[]>([
    { role: 'agent', content: "Hi. I'm your NicheFlow Assistant. Ask me to book an appointment, analyze revenue, or update settings." }
  ]);
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery('');
    setResponses(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Mock mode fallback or real edge function call
      let agentResponse = "";

      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: { 
          query: userMessage, 
          userId: session?.user?.id, 
          action: 'agent_chat',
          mock: true // Use mock mode for now since we don't have API keys active
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.response) {
        agentResponse = data.response;
      } else {
        // Fallback mock response if edge function didn't return properly formatted data
        await new Promise(r => setTimeout(r, 1000));
        agentResponse = "I've processed your request. (Mock Mode Active)";
      }

      setResponses(prev => [...prev, { role: 'agent', content: agentResponse }]);
    } catch (error) {
      console.error("Agent error:", error);
      setResponses(prev => [...prev, { role: 'agent', content: "I encountered an error connecting to the orchestrator. Is the edge function running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button for AI */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C4B5FD] shadow-[0_8px_32px_rgba(129,140,248,0.4)] flex items-center justify-center cursor-pointer group"
      >
        {/* Breathing ring effect */}
        <div className="absolute inset-0 rounded-full border border-[#818CF8] animate-ping opacity-20"></div>
        <span className="text-[#0A0A0B] text-[24px] relative z-10 group-hover:rotate-12 transition-transform duration-300">✦</span>
      </motion.button>

      {/* AI Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#0A0A0B]/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[rgba(17,17,19,0.95)] backdrop-blur-2xl border-l border-[rgba(255,255,255,0.08)] z-[101] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C4B5FD] flex items-center justify-center shadow-[0_0_15px_rgba(129,140,248,0.3)]">
                    <span className="text-[#0A0A0B] text-[16px]">✦</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#F4F4F5] text-[15px]">NicheFlow Agent</span>
                    <span className="text-[11px] text-[#818CF8] font-medium tracking-wide">ONLINE</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[#A1A1AA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col space-y-6 scrollbar-hidden">
                {responses.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[rgba(255,255,255,0.08)] text-[#F4F4F5] rounded-tr-sm border border-[rgba(255,255,255,0.05)]' 
                        : 'bg-[rgba(129,140,248,0.1)] text-[#E0E7FF] rounded-tl-sm border border-[rgba(129,140,248,0.2)]'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[rgba(129,140,248,0.05)] border border-[rgba(129,140,248,0.1)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#818CF8]"></motion.div>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#818CF8]"></motion.div>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#818CF8]"></motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A0B]">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask NicheFlow to do something..."
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-4 pr-12 text-[#F4F4F5] placeholder:text-[#52525B] text-[14px] focus:outline-none focus:border-[rgba(129,140,248,0.5)] focus:bg-[rgba(255,255,255,0.06)] transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[rgba(129,140,248,0.15)] text-[#818CF8] flex items-center justify-center hover:bg-[rgba(129,140,248,0.25)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-center text-[10px] text-[#52525B] space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Powered by Gemini Edge Functions</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
