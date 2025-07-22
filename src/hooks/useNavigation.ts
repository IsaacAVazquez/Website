"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useNavigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  
  // Mobile detection with proper SSR handling
  useEffect(() => {
    const checkMobile = () => {
      // Use same breakpoint as Tailwind's md: (768px)
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar when switching to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    const handleResize = () => {
      checkMobile();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Scroll detection for FloatingNav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  // Determine which navigation should be shown
  // Exclude home page and fantasy football pages (need full width for charts)
  const isFantasyFootballPage = pathname.startsWith('/fantasy-football');
  const showSidebar = pathname !== '/' && !isFantasyFootballPage;
  const showFloatingNav = pathname === '/' || isMobile || isFantasyFootballPage;
  
  return {
    isMobile,
    sidebarOpen,
    isScrolled,
    showSidebar,
    showFloatingNav,
    toggleSidebar,
    closeSidebar,
    pathname
  };
}