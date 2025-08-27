// hooks/useResponsiveOverlay.js
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Handles viewport/orientation classes & mobile interactions for the Auth overlay.
 * Applies .landscape-mode (slide from right) or .portrait-mode (slide from bottom)
 * exactly as in the original component.
 */
export const useResponsiveOverlay = ({ overlayRef, isVisible, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const activeInputRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  const updateViewport = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setViewportDimensions({ width, height });
    setIsMobile(width <= 768);
    setIsLandscape(width > height);

    // add orientation class to overlay
    if (overlayRef?.current) {
      const overlay = overlayRef.current;
      overlay.classList.remove('landscape-mode', 'portrait-mode');
      if (width > height) {
        overlay.classList.add('landscape-mode');
      } else {
        overlay.classList.add('portrait-mode');
      }
    }

    // virtual keyboard on mobile
    if (width <= 768 && activeInputRef.current) {
      const viewportHeight = window.visualViewport?.height || height;
      if (viewportHeight < height * 0.75) {
        document.body.style.height = `${viewportHeight}px`;
      } else {
        document.body.style.height = '';
      }
    }
  }, [overlayRef]);

  // Effects
  useEffect(() => {
    updateViewport();

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateViewport, 150);
    };

    const handleOrientationChange = () => setTimeout(updateViewport, 300);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      }
      document.body.style.height = '';
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateViewport]);

  useEffect(() => {
    if (isVisible) setTimeout(updateViewport, 50);
  }, [isVisible, updateViewport]);

  // Mobile back button + ESC handling
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isVisible) onClose?.();
    };

    const handleBackButton = (event) => {
      // For mobile single-page apps
      if (isVisible && isMobile) {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    if (isMobile && 'history' in window) {
      window.addEventListener('popstate', handleBackButton);
      if (isVisible) {
        window.history.pushState(null, '', window.location.href);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      if (isMobile) window.removeEventListener('popstate', handleBackButton);
    };
  }, [isVisible, isMobile, onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (!isMobile || !overlayRef?.current) return;
    const t = e.touches[0];
    overlayRef.current.touchStartX = t.clientX;
    overlayRef.current.touchStartY = t.clientY;
  }, [isMobile, overlayRef]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile || !overlayRef?.current || !overlayRef.current.touchStartX) return;
    const t = e.touches[0];
    const dx = t.clientX - overlayRef.current.touchStartX;
    const dy = t.clientY - overlayRef.current.touchStartY;
    if ((isLandscape && Math.abs(dx) > Math.abs(dy) && dx > 0) ||
        (!isLandscape && Math.abs(dy) > Math.abs(dx) && dy > 0)) {
      e.preventDefault();
    }
  }, [isMobile, isLandscape, overlayRef]);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile || !overlayRef?.current || !overlayRef.current.touchStartX) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - overlayRef.current.touchStartX;
    const dy = t.clientY - overlayRef.current.touchStartY;
    const threshold = 50;
    if (isLandscape && dx > threshold) onClose?.();
    else if (!isLandscape && dy > threshold) onClose?.();
    overlayRef.current.touchStartX = null;
    overlayRef.current.touchStartY = null;
  }, [isMobile, isLandscape, overlayRef, onClose]);

  // Focus helpers for inputs to scroll them into view on mobile
  const handleInputFocus = useCallback((e) => {
    activeInputRef.current = e.target;
    if (isMobile) {
      setTimeout(() => {
        if (e.target?.scrollIntoView) {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [isMobile]);

  const handleInputBlur = useCallback(() => {
    if (isMobile) setTimeout(() => { document.body.style.height = ''; }, 300);
  }, [isMobile]);

  return {
    isMobile,
    isLandscape,
    viewportDimensions,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleInputFocus,
    handleInputBlur,
  };
};
