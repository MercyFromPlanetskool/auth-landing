import * as THREE from 'three';

// === POSITION MANAGEMENT CLASS === //
export class Position {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static fromPercentage(xPercent, yPercent) {
    return new Position(
      typeof xPercent === 'string' ? parseFloat(xPercent.replace('%', '')) : xPercent,
      typeof yPercent === 'string' ? parseFloat(yPercent.replace('%', '')) : yPercent
    );
  }

  lerp(target, factor) {
    this.x += (target.x - this.x) * factor;
    this.y += (target.y - this.y) * factor;
    return this;
  }

  toPercentageString() {
    return {
      x: this.x + '%',
      y: this.y + '%'
    };
  }

  clone() {
    return new Position(this.x, this.y);
  }
}

// === POSITION CALCULATOR === //
export class PositionCalculator {
  static getScreenInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    return { width, height, isPortrait };
  }

  static getTextPosition() {
    const { isPortrait } = this.getScreenInfo();
    
    if (isPortrait) {
      // Portrait: text in top 50% of screen, centered
      return { x: '50%', y: '25%', isPortrait: true };
    } else {
      // Landscape: text in left 50% of screen, centered
      return { x: '25%', y: '50%', isPortrait: false };
    }
  }

  // Convert 3D world position to 2D screen coordinates
  static worldToScreen(worldPos, camera, renderer) {
    const vector = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    vector.project(camera);
    
    // Use window dimensions instead of renderer canvas dimensions for better reliability
    const width = window.innerWidth;
    const height = window.innerHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;
    
    return {
      x: ((vector.x * widthHalf) + widthHalf),
      y: (-(vector.y * heightHalf) + heightHalf)
    };
  }

  // Get text position that follows Earth center in world space
  static getTextPositionRelativeToEarth(earthGroup, camera, renderer) {
    if (!earthGroup || !camera || !renderer) {
      return { x: 50, y: 50 }; // Return numeric values
    }

    // Get the world position of the Earth center
    const earthWorldPos = new THREE.Vector3();
    earthGroup.getWorldPosition(earthWorldPos);
    
    // Convert world position to screen coordinates
    const screenPos = this.worldToScreen(earthWorldPos, camera, renderer);
    
    // Use window dimensions for percentage calculation
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Convert to percentage of screen - logo will be centered on Earth
    const xPercent = (screenPos.x / width) * 100;
    const yPercent = (screenPos.y / height) * 100;
    
    // Return numeric percentages (not strings)
    return {
      x: Math.max(5, Math.min(95, xPercent)), // Numeric value between 5 and 95
      y: Math.max(5, Math.min(95, yPercent))  // Numeric value between 5 and 95
    };
  }

  static getEarthPosition(camera = null) {
    const { width, height, isPortrait } = this.getScreenInfo();
    
    const cameraRef = camera || { 
      position: { z: 2 }, 
      fov: 50 
    };
    
    const distance = cameraRef.position.z;
    const vFOV = THREE.MathUtils.degToRad(cameraRef.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * (width / height);
    
    if (isPortrait) {
      // Portrait: shift to top 50% of height, centered horizontally
      const position = { 
        x: 0, // Center horizontally
        y: visibleHeight * 0.25, // Move up to center in top 50%
        isPortrait: true 
      };
      return position;
    } else {
      // Landscape: shift to left 50% of width, centered vertically
      const position = { 
        x: -(visibleWidth * 0.25), // Move left to center in left 50%
        y: 0, // Center vertically
        isPortrait: false 
      };
      return position;
    }
  }
}
