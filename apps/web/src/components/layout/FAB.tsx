import React, { useState } from 'react';
import { Plus, Calendar, FileText, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Calendar, label: 'Booking', color: 'bg-[#818CF8]' },
    { icon: FileText, label: 'Invoice', color: 'bg-[#34D399]' },
    { icon: User, label: 'Client', color: 'bg-[#FBBF24]' },
  ];

  return (
    <div className="fixed bottom-[100px] right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[60px] right-0 flex flex-col items-end space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-3 group"
              >
                <span className="px-2 py-1 bg-[rgba(10,10,11,0.8)] backdrop-blur-md rounded-md text-[12px] font-medium text-[#F4F4F5] opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center text-[#0A0A0B] shadow-lg`}>
                  <action.icon className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-[0_8px_32px_rgba(245,158,11,0.4)] flex items-center justify-center text-[#0A0A0B]"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}
