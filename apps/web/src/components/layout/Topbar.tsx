import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Command, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export function Topbar() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  // Create breadcrumbs based on route
  const breadcrumbs = ['Home', ...pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1))];

  return (
    <div className="fixed top-0 right-0 left-0 md:left-[240px] h-[56px] bg-[rgba(10,10,11,0.85)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] z-40 flex items-center justify-between px-4 md:px-6">
      
      {/* Breadcrumbs (Hidden on mobile) */}
      <div className="hidden md:flex items-center space-x-2">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className={`text-[13px] ${idx === breadcrumbs.length - 1 ? 'text-[#F4F4F5] font-medium' : 'text-[#52525B]'}`}>
              {crumb}
            </span>
            {idx < breadcrumbs.length - 1 && (
              <span className="text-[#52525B] text-[10px]">/</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Title (Only shown on mobile) */}
      <div className="md:hidden flex items-center">
        <div className="flex flex-col justify-center items-start space-y-[3px] mr-2">
          <div className="h-[2px] w-[12px] bg-[#F59E0B]"></div>
          <div className="h-[2px] w-[8px] bg-[#F59E0B]"></div>
          <div className="h-[2px] w-[5px] bg-[#F59E0B]"></div>
        </div>
        <span className="font-semibold text-[#F4F4F5] text-[18px] tracking-tight">{breadcrumbs[breadcrumbs.length - 1] || 'Dashboard'}</span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Global Search Bar (Mac Spotlight Style) */}
        <div className="hidden md:flex items-center h-8 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 text-[#A1A1AA] text-[13px] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors cursor-pointer w-[240px]">
          <Search className="w-3.5 h-3.5 mr-2 opacity-70" />
          <span>Search or ask AI...</span>
          <div className="ml-auto flex items-center space-x-1 opacity-50">
            <Command className="w-3 h-3" />
            <span className="text-[10px] font-medium font-sans">K</span>
          </div>
        </div>

        {/* Search Icon for Mobile */}
        <button className="md:hidden w-8 h-8 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
          <Search className="w-4 h-4 text-[#F4F4F5]" />
        </button>

        {/* Notifications */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-8 h-8 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#F59E0B] rounded-full border-2 border-[#0A0A0B]"></span>
        </motion.button>
      </div>
    </div>
  );
}
