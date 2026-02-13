/**
 * Bottom sheet component for mobile devices
 * Provides a draggable sheet that slides up from the bottom with snap points
 */

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

type SnapPoint = 'collapsed' | 'half' | 'expanded';

const SNAP_POINTS = {
  collapsed: 96, // px from bottom - peek height
  half: 50, // vh
  expanded: 90, // vh
};

export function BottomSheet({ children, isOpen }: BottomSheetProps) {
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Calculate sheet height based on snap point
  const getSheetHeight = () => {
    if (snapPoint === 'collapsed') {
      return SNAP_POINTS.collapsed;
    } else if (snapPoint === 'half') {
      return (window.innerHeight * SNAP_POINTS.half) / 100;
    } else {
      return (window.innerHeight * SNAP_POINTS.expanded) / 100;
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50; // px to trigger snap

    if (deltaY > threshold) {
      // Dragged down
      if (snapPoint === 'expanded') {
        setSnapPoint('half');
      } else if (snapPoint === 'half') {
        setSnapPoint('collapsed');
      }
    } else if (deltaY < -threshold) {
      // Dragged up
      if (snapPoint === 'collapsed') {
        setSnapPoint('half');
      } else if (snapPoint === 'half') {
        setSnapPoint('expanded');
      }
    }

    setIsDragging(false);
  };

  // Reset to half when opened
  useEffect(() => {
    if (isOpen) {
      setSnapPoint('half');
    }
  }, [isOpen]);

  const sheetHeight = getSheetHeight();
  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <div
      ref={sheetRef}
      className="lg:hidden fixed left-0 right-0 bg-base-100 z-[900] shadow-2xl rounded-t-3xl transition-all duration-300 ease-out"
      style={{
        bottom: 0,
        height: `${sheetHeight}px`,
        transform: `translateY(${dragOffset}px)`,
      }}
    >
      {/* Drag handle */}
      <div
        className="w-full py-3 cursor-grab active:cursor-grabbing flex justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 rounded-full bg-base-300" />
      </div>

      {/* Sheet content */}
      <div className="h-[calc(100%-48px)] overflow-hidden">
        {children}
      </div>

      {/* Snap point indicators (for debugging/UX) */}
      <div className="absolute top-3 right-4 flex gap-1">
        <button
          onClick={() => setSnapPoint('collapsed')}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            snapPoint === 'collapsed' ? 'bg-primary' : 'bg-base-300'
          }`}
          aria-label="Collapse sheet"
        />
        <button
          onClick={() => setSnapPoint('half')}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            snapPoint === 'half' ? 'bg-primary' : 'bg-base-300'
          }`}
          aria-label="Half sheet"
        />
        <button
          onClick={() => setSnapPoint('expanded')}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            snapPoint === 'expanded' ? 'bg-primary' : 'bg-base-300'
          }`}
          aria-label="Expand sheet"
        />
      </div>
    </div>
  );
}
