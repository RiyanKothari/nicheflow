import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MOBILE_ITEMS = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
  { name: 'Search', path: '/search', icon: Search },
  { name: 'Clients', path: '/clients', icon: Users },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[rgba(10,10,11,0.95)] border-t border-[rgba(255,255,255,0.06)] backdrop-blur-xl z-50 px-6 pb-safe flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {MOBILE_ITEMS.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="relative flex flex-col items-center justify-center w-16 h-full text-center group"
          >
            {isActive && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute inset-0 top-1 bottom-4 bg-[rgba(255,255,255,0.06)] rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            
            <item.icon 
              className={cn(
                "w-5 h-5 mb-1 z-10 transition-colors", 
                isActive ? "text-[#F59E0B]" : "text-[#52525B]"
              )} 
            />
            <span 
              className={cn(
                "text-[10px] font-medium z-10 transition-colors",
                isActive ? "text-[#F4F4F5]" : "text-[#52525B]"
              )}
            >
              {item.name}
            </span>
            
            {isActive && (
              <motion.div 
                layoutId="mobile-nav-dot"
                className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#F59E0B]"
              />
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
