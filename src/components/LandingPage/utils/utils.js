import * as THREE from 'three';
import { PositionCalculator } from './position.js';

// === UTILITY FUNCTIONS === //
export const Utils = {
  // Get current screen dimensions
  getScreenWidth() {
    return window.innerWidth;
  },

  getScreenHeight() {
    return window.innerHeight;
  },

  // Check if device is in portrait mode
  isPortraitMode() {
    return this.getScreenHeight() > this.getScreenWidth();
  },

  // Check if device is in landscape mode
  isLandscapeMode() {
    return this.getScreenWidth() > this.getScreenHeight();
  },

  // Get Earth size in pixels for current orientation
  getEarthSizeInPixels() {
    const screenWidth = this.getScreenWidth();
    const screenHeight = this.getScreenHeight();
    const isPortrait = this.isPortraitMode();
    
    if (isPortrait) {
    // Portrait: 50% of width
    return screenWidth * 0.4;
    } else {
      // Landscape: 60% of height
      return screenHeight * 0.6;
    }
  },

  // Get positioning info for debugging (not displayed to user)
  getPositioningInfo() {
    const width = this.getScreenWidth();
    const height = this.getScreenHeight();
    const isPortrait = this.isPortraitMode();
    const earthSize = this.getEarthSizeInPixels();
    const earthRadius = this.getResponsiveEarthRadius();
    
    return {
      screenWidth: width,
      screenHeight: height,
      orientation: isPortrait ? 'portrait' : 'landscape',
      earthSizePixels: earthSize,
      earthRadius3D: earthRadius,
      positioning: isPortrait ? 
        'Earth centers in top 40% when shifted' : 
        'Earth centers in left 50% when shifted'
    };
  },

  // Calculate logo size based on actual Earth and cloud size
  getLogoSize() {
    // Get the exact Earth size in pixels as it appears on screen
    const earthSizePixels = this.getEarthSizeInPixels();
    
  // Logo width should be 80% of Earth diameter in portrait, 70% otherwise
  const isPortrait = this.isPortraitMode();
  const logoWidth = isPortrait ? earthSizePixels * 1.2 : earthSizePixels * 0.8;
    
    // Apply reasonable bounds while maintaining Earth proportionality
    const minSize = Math.min(80, earthSizePixels * 0.5); // 50% of Earth minimum
    const maxSize = Math.max(400, earthSizePixels * 0.9); // 90% of Earth maximum
    
    return Math.max(minSize, Math.min(maxSize, logoWidth));
  },

  // Update logo styles based on Earth sizing
  updateLogoStyles() {
    const logoContainer = document.getElementById('planetkool-logo');
    const logoImg = logoContainer?.querySelector('img');
    
    if (!logoContainer || !logoImg) {
      return;
    }

    const earthSizePixels = this.getEarthSizeInPixels();
    const logoWidth = this.getLogoSize();
    const earthToLogoRatio = ((logoWidth / earthSizePixels) * 100).toFixed(1);

    // Apply logo width (maintaining aspect ratio)
    logoImg.style.width = `${logoWidth}px`;
    logoImg.style.height = 'auto'; // Maintains aspect ratio automatically
    
    // Show the logo
    logoContainer.style.display = 'block';
  },

  // Update logo position to follow Earth center with smooth interpolation
  updateLogoPosition(earthScene) {
    const logoContainer = document.getElementById('planetkool-logo');
    if (!logoContainer) {
      return;
    }
    
    if (!earthScene || !earthScene.earthGroup || !earthScene.camera || !earthScene.renderer) {
      return;
    }

    try {
      // Get Earth center position in screen coordinates using same logic as Earth movement
      const earthScreenPos = PositionCalculator.getTextPositionRelativeToEarth(
        earthScene.earthGroup, 
        earthScene.camera, 
        earthScene.renderer
      );
      
      // Set target logo position (where we want the logo to move to)
      earthScene.targetLogoPosition.x = earthScreenPos.x;
      earthScene.targetLogoPosition.y = earthScreenPos.y;
      
      // Use smooth interpolation to animate logo position (same as Earth animation)
      earthScene.logoPosition = earthScene.animationManager.lerpPosition(
        earthScene.logoPosition, 
        earthScene.targetLogoPosition
      );
      
      // Apply the smoothly interpolated position to the logo
      logoContainer.style.left = `${earthScene.logoPosition.x}%`;
      logoContainer.style.top = `${earthScene.logoPosition.y}%`;
      
    } catch (error) {
      // Fallback to screen center with smooth animation
      earthScene.targetLogoPosition.x = 50;
      earthScene.targetLogoPosition.y = 50;
      earthScene.logoPosition = earthScene.animationManager.lerpPosition(
        earthScene.logoPosition, 
        earthScene.targetLogoPosition
      );
      logoContainer.style.left = `${earthScene.logoPosition.x}%`;
      logoContainer.style.top = `${earthScene.logoPosition.y}%`;
    }
  },

  toRawURL(githubURL) {
    if (!githubURL.includes('github.com')) return githubURL;
    const url = new URL(githubURL);
    url.hostname = 'raw.githubusercontent.com';
    url.pathname = url.pathname.replace('/blob/', '/');
    return url.href;
  },

  // Calculate responsive Earth radius based on new 60% sizing rules
  getResponsiveEarthRadius() {
    const screenWidth = this.getScreenWidth();
    const screenHeight = this.getScreenHeight();
    const isPortrait = this.isPortraitMode();
    
    // Camera settings for 3D space calculations
    const cameraZ = 2; // From CONFIG.CAMERA.INITIAL_Z
    const cameraFOV = 50; // From CONFIG.CAMERA.FOV
    
    // Calculate visible 3D space dimensions
    const vFOV = (cameraFOV * Math.PI) / 180; // Convert to radians
    const visibleHeight = 2 * Math.tan(vFOV / 2) * cameraZ;
    const visibleWidth = visibleHeight * (screenWidth / screenHeight);
    
    if (isPortrait) {
      // Portrait: Earth size = 60% of screen width
      // Convert screen percentage to 3D space
      const earthSizeInScreen = screenWidth * 0.6;
      const earthSizeIn3D = (earthSizeInScreen / screenWidth) * visibleWidth;
      return earthSizeIn3D / 2; // Radius is half the diameter
    } else {
      // Landscape: Earth size = 60% of screen height  
      // Convert screen percentage to 3D space
      const earthSizeInScreen = screenHeight * 0.6;
      const earthSizeIn3D = (earthSizeInScreen / screenHeight) * visibleHeight;
      return earthSizeIn3D / 2; // Radius is half the diameter
    }
  },

  // Calculate responsive cloud radius (slightly larger than Earth)
  getResponsiveCloudRadius() {
    return this.getResponsiveEarthRadius() + 0.005;
  },

  // Calculate responsive segments for geometry quality
  getResponsiveSegments() {
    const screenWidth = window.innerWidth;
    
    // Lower quality on smaller screens for better performance
    if (screenWidth < 480) {
      return 32; // Mobile - lower quality for performance
    } else if (screenWidth < 768) {
      return 48; // Large mobile - medium quality
    } else {
      return 64; // Desktop - high quality
    }
  },

  // Calculate responsive button size and positioning
  getResponsiveButtonStyles() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (screenWidth < 480) {
      // Mobile phones - larger touch targets
      return {
        fontSize: 'clamp(14px, 4vw, 18px)',
        padding: '12px 24px',
        bottom: '8%',
        right: '5%',
        borderRadius: '30px'
      };
    } else if (screenWidth < 768) {
      // Large phones/small tablets
      return {
        fontSize: 'clamp(16px, 3.5vw, 20px)',
        padding: '14px 28px',
        bottom: '6%',
        right: '5%',
        borderRadius: '40px'
      };
    } else if (screenWidth < 1024) {
      // Tablets
      return {
        fontSize: 'clamp(18px, 3vw, 22px)',
        padding: '15px 30px',
        bottom: '5%',
        right: '5%',
        borderRadius: '50px'
      };
    } else {
      // Desktop
      return {
        fontSize: 'clamp(16px, 3vw, 24px)',
        padding: '15px 30px',
        bottom: '5%',
        right: '5%',
        borderRadius: '50px'
      };
    }
  },

  // Apply responsive styles to button
  updateButtonStyles() {
    const button = document.getElementById('getStartedBtn');
    if (!button) return;
    
    const styles = this.getResponsiveButtonStyles();
    
    button.style.fontSize = styles.fontSize;
    button.style.padding = styles.padding;
    button.style.bottom = styles.bottom;
    button.style.right = styles.right;
    button.style.borderRadius = styles.borderRadius;
  },

  // Calculate Earth shift distance based on screen orientation
  calculateEarthShiftForScreenPosition(earthScene) {
    return PositionCalculator.getEarthPosition(earthScene.camera);
  },

  calculateSunPosition() {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    
    const declination = -23.45 * Math.cos(2 * Math.PI / 365 * (dayOfYear + 10));
    const sunLatRad = THREE.MathUtils.degToRad(declination);
    const sunLonRad = THREE.MathUtils.degToRad((utcHours - 12) * 15);
    
    const sunPosRadius = 5;
    return {
      x: sunPosRadius * Math.cos(sunLatRad) * Math.cos(sunLonRad),
      y: sunPosRadius * Math.sin(sunLatRad),
      z: sunPosRadius * Math.cos(sunLatRad) * Math.sin(sunLonRad)
    };
  }
};
