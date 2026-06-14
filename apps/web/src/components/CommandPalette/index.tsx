import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, LayoutDashboard, CalendarCheck, Users, Settings, Package, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Input } from "../ui/input";

const ACTIONS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'bookings', label: 'View Bookings', icon: CalendarCheck, path: '/bookings' },
  { id: 'clients', label: 'Manage Clients', icon: Users, path: '/clients' },
  { id: 'inventory', label: 'View Inventory', icon: Package, path: '/inventory' },
  { id: 'public-page', label: 'Edit Public Page', icon: Globe, path: '/public-presence' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredActions = ACTIONS.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
      }
      if (e.key === 'Enter' && filteredActions[selectedIndex]) {
        e.preventDefault();
        navigate(filteredActions[selectedIndex].path);
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, navigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-2xl bg-[rgba(17,17,19,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden flex flex-col pointer-events-auto"
            >
              <div className="p-4 border-b border-[rgba(255,255,255,0.06)] relative flex items-center">
                <Search className="absolute left-7 w-5 h-5 text-[#52525B]" />
                <input
                  autoFocus
                  placeholder="Ask AI or search commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-[#F4F4F5] text-[18px] placeholder:text-[#52525B] focus:ring-0 outline-none pl-11 py-2 font-sans"
                />
                <div className="absolute right-6 flex items-center space-x-1 px-2 py-1 bg-[rgba(255,255,255,0.04)] rounded-md border border-[rgba(255,255,255,0.06)] opacity-70">
                  <span className="text-[10px] text-[#A1A1AA]">esc</span>
                </div>
              </div>

              <div className="p-2 overflow-y-auto max-h-[60vh] scrollbar-hidden">
                {searchQuery && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-[11px] font-medium tracking-[0.08em] uppercase text-[#52525B]">
                      Ask AI Agent
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 mx-1 rounded-lg bg-[rgba(129,140,248,0.1)] border border-[rgba(129,140,248,0.2)] cursor-pointer hover:bg-[rgba(129,140,248,0.15)] transition-colors group">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C4B5FD] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(129,140,248,0.3)]">
                          <span className="text-[#0A0A0B] text-[16px]">✦</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-[#F4F4F5]">Ask "{searchQuery}"</span>
                          <span className="text-[12px] text-[#818CF8]">AI Assistant will process this</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#818CF8] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </div>
                )}

                <div>
                  <div className="px-3 py-2 text-[11px] font-medium tracking-[0.08em] uppercase text-[#52525B]">
                    Commands
                  </div>
                  {filteredActions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[#52525B] text-[14px]">
                      No commands found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1">
                      {filteredActions.map((action, index) => {
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={action.id}
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => {
                              navigate(action.path);
                              setIsOpen(false);
                            }}
                            className={cn(
                              "flex items-center px-4 py-3 mx-1 rounded-lg cursor-pointer transition-colors group",
                              isSelected
                                ? "bg-[rgba(255,255,255,0.06)] text-[#F4F4F5]"
                                : "text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)]"
                            )}
                          >
                            <action.icon className={cn("w-4 h-4 mr-3", isSelected ? "text-[#F59E0B]" : "text-[#52525B] group-hover:text-[#A1A1AA]")} />
                            <span className="text-[14px] font-medium">{action.label}</span>

                            {isSelected && (
                              <span className="ml-auto flex items-center">
                                <span className="text-[10px] text-[#52525B] mr-1">Press</span>
                                <div className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-[#A1A1AA] text-[10px]">
                                  ↵
                                </div>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
