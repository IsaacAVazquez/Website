"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useNavigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  
  // Mobile detection with proper SSR handling and throttling
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
    
    // Throttled resize handler for better performance
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 100); // Throttle to 100ms
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);
  
  // Scroll detection for FloatingNav with throttling
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolled(window.scrollY > 100);
      }, 16); // Throttle to ~60fps
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
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
  const isFantasyFootballPage = pathname.startsWith('/fantasy-football');
  
  // Navigation strategy:
  // - Home page: Sidebar on desktop, no FloatingNav (clean experience with command palette)
  // - Fantasy pages: FloatingNav (need full width for charts)
  // - Other pages: Sidebar on desktop, FloatingNav on mobile
  const showSidebar = !isMobile && !isFantasyFootballPage;
  const showFloatingNav = isMobile && !isFantasyFootballPage;
  
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