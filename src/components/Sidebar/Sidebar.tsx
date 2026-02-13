/**
 * Sidebar container component
 */

import type { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ children, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile drawer overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar panel */}
      <div
        className={`fixed lg:relative top-0 left-0 h-full w-full sm:w-96 bg-base-100 z-50 lg:z-10 
          flex flex-col shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {children}
      </div>
    </>
  );
}
