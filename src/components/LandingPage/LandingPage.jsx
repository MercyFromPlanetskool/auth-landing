import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LandingPage.css';
import { FontLoader } from './utils/fontLoader.js';
import { EarthScene } from './utils/earthScene.js';
import { Utils } from './utils/utils.js';
import AuthModal from '../AuthModal/AuthModal';

const LandingPage = () => {
  const earthSceneRef = useRef(null);
  const initializationRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  /*
   * MULTIPLE WAYS TO SHOW LOGIN PANEL & SHIFT EARTH:
   * 1. Click "Get Started" button -> calls handleGetStartedClick() -> navigate('/signup')
   * 2. Direct URL navigation to '/signup' -> triggers useEffect below
   * 3. Programmatic call to showLoginPanel() -> navigate('/signup')
   * 4. Direct call to triggerLoginMode() -> no navigation, direct state change
   * 
   * All methods result in: Show login panel + Hide button + Shift Earth left
   */

  // Check if we should show login panel based on current route
  useEffect(() => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    if (location.pathname === '/signup') {
      setIsLoginVisible(true);
      // Hide Get Started button with smooth transition when login panel is visible
      if (getStartedBtn) {
        getStartedBtn.style.opacity = '0';
        getStartedBtn.style.transform = 'translateY(20px)';
        getStartedBtn.style.pointerEvents = 'none';
        setTimeout(() => {
          getStartedBtn.style.display = 'none';
        }, 400); // Match transition duration
      }
      // Trigger Earth shift if scene is ready
      if (earthSceneRef.current) {
        // Use animated shift only if we're not initializing (avoid double animation)
        if (earthSceneRef.current.isShifted === false) {
          earthSceneRef.current.shiftToPresentation();
        }
      } else {
        // If scene isn't ready yet, wait and try again
        const retryShift = () => {
          if (earthSceneRef.current) {
            if (earthSceneRef.current.isShifted === false) {
              earthSceneRef.current.shiftToPresentation();
            }
          } else {
            setTimeout(retryShift, 100);
          }
        };
        setTimeout(retryShift, 100);
      }
    } else {
      setIsLoginVisible(false);
      // Show Get Started button with smooth transition when login panel is hidden
      if (getStartedBtn) {
        getStartedBtn.style.display = 'block';
        setTimeout(() => {
          getStartedBtn.style.opacity = '1';
          getStartedBtn.style.transform = 'translateY(0)';
          getStartedBtn.style.pointerEvents = 'auto';
        }, 50); // Small delay to ensure display is applied first
      }
      // Return Earth to center if scene is ready
      if (earthSceneRef.current) {
        earthSceneRef.current.returnToCenter();
      } else {
        // If scene isn't ready yet, wait and try again
        const retryReturn = () => {
          if (earthSceneRef.current) {
            earthSceneRef.current.returnToCenter();
          } else {
            setTimeout(retryReturn, 100);
          }
        };
        setTimeout(retryReturn, 100);
      }
    }
  }, [location.pathname]);

  const handleGetStartedClick = () => {
    // Navigate to signup route (this will trigger the useEffect above)
    navigate('/signup');
  };

  // Direct function to show login panel (alternative to Get Started button)
  const showLoginPanel = () => {
    // This does the same thing as clicking Get Started button
    navigate('/signup');
  };

  // Direct function to trigger Earth shift and login panel without navigation
  const triggerLoginMode = () => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    setIsLoginVisible(true);
    // Hide Get Started button
    if (getStartedBtn) {
      getStartedBtn.style.opacity = '0';
      getStartedBtn.style.transform = 'translateY(20px)';
      getStartedBtn.style.pointerEvents = 'none';
      setTimeout(() => {
        getStartedBtn.style.display = 'none';
      }, 400);
    }
    // Trigger Earth shift
    if (earthSceneRef.current) {
      earthSceneRef.current.shiftToPresentation();
    }
  };

  const handleCloseLogin = () => {
    // Navigate back to home (this will trigger the useEffect above)
    navigate('/');
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Prevent double initialization in React StrictMode
      if (initializationRef.current) {
        return;
      }
      
      initializationRef.current = true;
      
      try {
        // Prevent multiple initializations
        if (earthSceneRef.current) {
          earthSceneRef.current.dispose();
          earthSceneRef.current = null;
        }
        
        // Load custom font
        await FontLoader.load();
        
        // Initialize 3D scene
        earthSceneRef.current = new EarthScene();
        earthSceneRef.current.init(handleGetStartedClick); // Pass the click handler
        
        // Check current route and set initial Earth position accordingly
        if (location.pathname === '/signup') {
          // If we're on /signup route (e.g., after refresh), immediately set Earth to shifted position
          setTimeout(() => {
            if (earthSceneRef.current) {
              earthSceneRef.current.setToPresentationMode(); // Use immediate positioning
            }
          }, 100); // Minimal delay to ensure scene is ready
        }
        
        // Show UI elements
        showUI();
        
        // Make functions globally available (for external calls)
        window.showPlanetskoolLogin = showLoginPanel;
        window.triggerPlanetskoolLogin = triggerLoginMode;
        
      } catch (error) {
        // Reset initialization flag on error
        initializationRef.current = false;
        // Continue with fallbacks
      }
    };

    const showUI = () => {
      setTimeout(() => {
        // Apply initial responsive styles
        Utils.updateButtonStyles();
        Utils.updateLogoStyles();
      }, 100);
    };

    // Initialize the app
    initializeApp();

    // Cleanup function
    return () => {
      if (earthSceneRef.current) {
        earthSceneRef.current.dispose();
        earthSceneRef.current = null;
      }
      // Reset initialization flag
      initializationRef.current = false;
    };
  }, []);

  return (
    <div className="landing-page">
      <canvas id="c"></canvas>
      
      {/* PlanetKool Logo at center of Earth */}
      <div id="planetkool-logo">
        <img 
          src="/planetkool-logo.png" 
          alt="PlanetKool"
          draggable="false"
        />
      </div>
      
      <button id="getStartedBtn">Get Started</button>
      
      {/* Login/Register Panel */}
      <AuthModal
        isVisible={isLoginVisible}
        onClose={handleCloseLogin}
      />
    </div>
  );
};

export default LandingPage;
