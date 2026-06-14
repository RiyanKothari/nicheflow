import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, FileText, Package, CheckSquare, Globe, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from "@/context/AuthContext";

const NAV_GROUPS = [
  {
    label: null,
    items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
      { name: 'Clients', path: '/clients', icon: Users },
      { name: 'Invoices', path: '/invoices', icon: FileText },
    ],
  },
  {
    label: 'Operate',
    items: [
      { name: 'Inventory', path: '/inventory', icon: Package },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Grow',
    items: [{ name: 'Public Page', path: '/public-presence', icon: Globe }],
  },
];

export function Sidebar() {
  const { session } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  // Derive active status
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isExpanded ? 240 : 60 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full bg-[rgba(10,10,11,0.95)] border-r border-[rgba(255,255,255,0.06)] backdrop-blur-[24px] z-[100] flex flex-col"
    >
      {/* Top Section */}
      <div className="p-5 flex-shrink-0 flex items-center h-[72px]">
        {isExpanded ? (
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsExpanded(false)}>
              <div className="flex flex-col justify-center items-start space-y-[3px] mr-1">
                <div className="h-[2px] w-[12px] bg-[#F59E0B]"></div>
                <div className="h-[2px] w-[8px] bg-[#F59E0B]"></div>
                <div className="h-[2px] w-[5px] bg-[#F59E0B]"></div>
              </div>
              <span className="font-semibold text-[#F4F4F5] text-[20px] tracking-[-0.04em] font-sans">niche<span className="font-light text-[#F59E0B]">flow</span></span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center w-full space-y-[3px] cursor-pointer" onClick={() => setIsExpanded(true)}>
            <div className="h-[2px] w-[12px] bg-[#F59E0B]"></div>
            <div className="h-[2px] w-[8px] bg-[#F59E0B]"></div>
            <div className="h-[2px] w-[5px] bg-[#F59E0B]"></div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-full py-1 pl-1 pr-2 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mr-2 flex-shrink-0"></div>
              <span className="text-[12px] font-medium text-[#F4F4F5] truncate max-w-[120px]">My Workspace</span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#A1A1AA]" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 flex flex-col space-y-4">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="relative">
            {group.label && isExpanded && (
              <div className="px-4 mb-2 text-[11px] font-medium tracking-[0.08em] uppercase text-[#52525B]">
                {group.label}
              </div>
            )}
            <div className="flex flex-col space-y-1 relative">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative flex items-center h-[36px] px-3 mx-2 rounded-lg transition-colors group outline-none",
                      active 
                        ? "bg-[rgba(245,158,11,0.10)] text-[#F4F4F5]" 
                        : "text-[#52525B] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1AA]"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-[-8px] h-[16px] w-[3px] bg-[#F59E0B] rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#F59E0B]" : "group-hover:text-[#A1A1AA]")} />
                    
                    {isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="ml-[10px] text-[14px] font-medium whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}

                    
                  </NavLink>
                );
              })}
            </div>
            {/* Divider between sections, except last */}
            {gIdx < NAV_GROUPS.length - 1 && isExpanded && (
              <div className="h-px bg-[rgba(255,255,255,0.06)] mx-4 mt-4" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="flex-shrink-0 p-2 mt-auto">
        <NavLink
          to="/settings"
          className={cn(
            "relative flex items-center h-[36px] px-3 mx-2 rounded-lg transition-colors group mb-4",
            isActive('/settings') ? "bg-[rgba(245,158,11,0.10)] text-[#F4F4F5]" : "text-[#52525B] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1AA]"
          )}
        >
          {isActive('/settings') && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-[-8px] h-[16px] w-[3px] bg-[#F59E0B] rounded-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Settings className={cn("w-4 h-4 flex-shrink-0", isActive('/settings') ? "text-[#F59E0B]" : "")} />
          {isExpanded && <span className="ml-[10px] text-[14px] font-medium">Settings</span>}
        </NavLink>

        <div className="h-px bg-[rgba(255,255,255,0.06)] mx-4 mb-4" />

        {isExpanded && (
          <div className="px-4 mb-2 flex items-center space-x-2">
            <div className="relative flex h-1.5 w-1.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#818CF8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#818CF8]"></span>
            </div>
            <span className="text-[11px] text-[#818CF8]">AI Active</span>
          </div>
        )}

        {isExpanded && (
          <div className="px-4 pb-4 flex items-center">
            <div className="w-7 h-7 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${session?.user?.email || 'NicheFlow'}`} alt="avatar" className="w-full h-full object-cover opacity-80" />
            </div>
            <div className="ml-3 flex flex-col overflow-hidden">
              <span className="text-[13px] font-medium text-[#F4F4F5] truncate">{session?.user?.email?.split('@')[0] || 'User'}</span>
              <div className="flex">
                <span className="text-[10px] uppercase tracking-wide text-[#A1A1AA] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded-sm mt-0.5">Owner</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
