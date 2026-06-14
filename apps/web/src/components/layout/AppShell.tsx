import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';

export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-void">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative z-10 md:ml-[240px]">
        {/* Topbar */}
        <Topbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-[56px] pb-[80px] md:pb-0 scrollbar-hidden relative">
          <div className="w-full max-w-[1440px] mx-auto p-4 md:p-6 min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <FAB />
        <MobileNav />
      </div>
    </div>
  );
}
