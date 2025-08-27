import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { CONFIG } from './config.js';
import { Position, PositionCalculator } from './position.js';
import { AnimationManager } from './animation.js';
import { Utils } from './utils.js';

// === 3D SCENE MANAGEMENT === //
export class EarthScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.earthGroup = null;
    this.earthMesh = null;
    this.cloudMesh = null;
    this.starMesh = null;
    this.sunLight = null;
    this.textureLoader = new THREE.TextureLoader();
    
    // Bind event handler functions to preserve 'this' context
    this.boundHandleResize = this.handleResize.bind(this);
    
    // Initialization state
    this.isInitialized = false;
    
    // Animation state
    this.isShifted = false;
    this.animationId = null;
    this.earthPosition = new Position(0, 0);
    this.targetEarthPosition = new Position(0, 0);
    this.animationManager = new AnimationManager();
    
    // Logo animation state for smooth movement
    this.logoPosition = new Position(50, 50); // Start at center (50%, 50%)
    this.targetLogoPosition = new Position(50, 50);
    
    // User interaction tracking
    this.isUserInteracting = false;  // Track user interaction
    this.interactionTimeout = null;  // Timeout for interaction
    
    // Legacy properties for compatibility
    this.targetX = 0;
    this.targetY = 0;
    this.targetTextLeft = CONFIG.ANIMATION.CENTER_PERCENT;
    this.targetTextX = '50%';
    this.targetTextY = '50%';
    this.currentTextX = '50%';
    this.currentTextY = '50%';
    
    // Default positions for reset
    this.defaultCameraPosition = new THREE.Vector3(0, 0, CONFIG.CAMERA.INITIAL_Z);
    this.defaultCameraTarget = new THREE.Vector3(0, 0, 0);
  }

  // Clean up any potential duplicate objects in the scene
  cleanupDuplicates() {
    if (!this.scene) return;
    
    const objectsToRemove = [];
    
    this.scene.traverse((child) => {
      // Count earth-like spheres
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
        // If it's not our official earth or cloud mesh, mark for removal
        if (child !== this.earthMesh && child !== this.cloudMesh && child !== this.starMesh) {
          objectsToRemove.push(child);
        }
      }
    });
    
    // Remove duplicate objects
    objectsToRemove.forEach(obj => {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    // Objects cleanup completed
  }

  // Complete disposal of the scene
  dispose() {
    
    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.boundHandleResize);
    }
    
    // Remove button event listener
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn && this.onGetStartedClick) {
      getStartedBtn.removeEventListener('click', this.onGetStartedClick);
    }
    
    // Clear timeouts
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
    }
    
    // Dispose of Three.js objects
    if (this.scene) {
      // Remove all objects from scene
      while(this.scene.children.length > 0) {
        const child = this.scene.children[0];
        this.scene.remove(child);
        
        // Dispose of geometries and materials
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    
    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Reset all references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.earthGroup = null;
    this.earthMesh = null;
    this.cloudMesh = null;
    this.starMesh = null;
    this.sunLight = null;
  }

  // Debug method to count objects in scene
  debugSceneObjects() {
    if (!this.scene) {
      return;
    }
    
    let earthCount = 0;
    let cloudCount = 0;
    let starCount = 0;
    let otherCount = 0;
    
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
        const radius = child.geometry.parameters.radius;
        
        if (radius > 90 && radius < 110) { // Earth-like size
          earthCount++;
        } else if (radius > 110 && radius < 130) { // Cloud-like size  
          cloudCount++;
        } else if (radius > 500) { // Star sphere size
          starCount++;
        } else {
          otherCount++;
        }
      }
    });
    
    return { earthCount, cloudCount, starCount, otherCount };
  }

  init(onGetStartedClick) {
    // Guard: prevent multiple initialization
    if (this.scene && this.renderer && this.camera) {
      this.debugSceneObjects();
      return;
    }
    
    this.onGetStartedClick = onGetStartedClick;
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupLighting();
    this.setupEarth();
    this.setupClouds();
    this.setupStars();
    this.setupControls();
    this.setupEventListeners();
    this.startAnimation();
    
    // Mark as initialized
    this.isInitialized = true;
    
    // Debug: check final scene state
    this.debugSceneObjects();
  }

  setupRenderer() {
    const canvas = document.querySelector('#c');
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0.0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.NEAR,
      CONFIG.CAMERA.FAR
    );
    this.camera.position.z = CONFIG.CAMERA.INITIAL_Z;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    
    // Create Earth group for positioning
    this.earthGroup = new THREE.Object3D();
    this.earthGroup.position.set(0, 0, 0); // Initialize with both X and Y positioning
    this.scene.add(this.earthGroup);
  }

  setupLighting() {
    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Sun light with real-world positioning
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;

    // Ensure the light's target is part of the scene graph
    this.scene.add(this.sunLight.target);

    // Initial position
    this.updateSunPosition();

    this.scene.add(this.sunLight);
    
    // Lens flare effects
    this.setupLensFlare();
  }

  setupLensFlare() {
    const flareTexture0 = this.textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png");
    const flareTexture3 = this.textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare3.png");
    
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(flareTexture0, 700, 0, this.sunLight.color));
    lensflare.addElement(new LensflareElement(flareTexture3, 60, 0.6));
    lensflare.addElement(new LensflareElement(flareTexture3, 70, 0.7));
    lensflare.addElement(new LensflareElement(flareTexture3, 120, 0.9));
    lensflare.addElement(new LensflareElement(flareTexture3, 70, 1.0));
    
    this.sunLight.add(lensflare);
  }

  setupEarth() {
    // Use responsive radius and segments
    const earthRadius = Utils.getResponsiveEarthRadius();
    const earthSegments = Utils.getResponsiveSegments();
    
    const earthGeometry = new THREE.SphereGeometry(earthRadius, earthSegments, earthSegments);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: this.textureLoader.load(Utils.toRawURL(CONFIG.URLS.TEXTURES.EARTH)),
      bumpMap: this.textureLoader.load(Utils.toRawURL(CONFIG.URLS.TEXTURES.BUMP)),
      emissiveMap: this.textureLoader.load(Utils.toRawURL(CONFIG.URLS.TEXTURES.NIGHT)),
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.0,
      bumpScale: 0.1,
      shininess: 5,
      specular: new THREE.Color(0x111111),
    });
    
    this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earthMesh.castShadow = true;
    this.earthMesh.receiveShadow = true;
    this.earthGroup.add(this.earthMesh);
  }

  setupClouds() {
    // Use responsive radius and segments
    const cloudRadius = Utils.getResponsiveCloudRadius();
    const cloudSegments = Utils.getResponsiveSegments();
    
    const cloudGeometry = new THREE.SphereGeometry(cloudRadius, cloudSegments, cloudSegments);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.textureLoader.load(Utils.toRawURL(CONFIG.URLS.TEXTURES.CLOUDS)),
      transparent: true,
      opacity: CONFIG.CLOUDS.OPACITY,
      depthWrite: false,
      shininess: 80,
      specular: new THREE.Color(0x666666),
    });
    
    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.cloudMesh.castShadow = true;
    this.earthGroup.add(this.cloudMesh);
  }

  setupStars() {
    const starGeometry = new THREE.SphereGeometry(CONFIG.STARS.RADIUS, CONFIG.STARS.SEGMENTS, CONFIG.STARS.SEGMENTS);
    const starMaterial = new THREE.MeshBasicMaterial({
      map: this.textureLoader.load(Utils.toRawURL(CONFIG.URLS.TEXTURES.STARS)),
      side: THREE.BackSide,
    });
    
    this.starMesh = new THREE.Mesh(starGeometry, starMaterial);
    this.scene.add(this.starMesh);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.screenSpacePanning = false;
       this.controls.minDistance = 1;
    this.controls.maxDistance = 4;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0;
    
    // Add interaction detection to prevent text following during user interaction
    this.controls.addEventListener('start', () => {
      this.onInteractionStart();
    });
    
    this.controls.addEventListener('end', () => {
      this.onInteractionEnd();
    });
  }

  onInteractionStart() {
    // User started interacting - stop text following
    this.isUserInteracting = true;
    
    // Clear any existing timeout
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
  }

  onInteractionEnd() {
    // User stopped interacting - resume text following after a short delay
    this.isUserInteracting = false;
    
    // Resume text following after 500ms of no interaction
    this.interactionTimeout = setTimeout(() => {
      // Only resume if we're in shifted mode and still not interacting
      if (this.isShifted && !this.isUserInteracting) {
        // Resume normal operation
      }
    }, 500);
  }

  // --- Astronomy helpers (minimal additions) ---
  deg2rad(d) { return d * Math.PI / 180; }
  normalizeRad(a) { a = a % (2 * Math.PI); return a < 0 ? a + 2 * Math.PI : a; }
  julianDate(date) { return date.getTime() / 86400000 + 2440587.5; } // Unix → JD

  // lon/lat (radians) → unit vector in Earth-fixed coords (east-positive longitude)
  lonLatToUnit(lonRad, latRad) {
    const cl = Math.cos(latRad);
    return new THREE.Vector3(
      cl * Math.cos(lonRad),
      cl * Math.sin(lonRad),
      Math.sin(latRad)
    ).normalize();
  }

  /**
   * Compute subsolar lat/lon and GMST for a given Date.
   * Accuracy ~0.1–0.3°, sufficient for visuals.
   * Returns { lat, lon, gmst } in radians.
   */
  computeSubsolar(date) {
    const JD = this.julianDate(date);
    const n  = JD - 2451545.0; // days since J2000.0

    // Sun’s apparent ecliptic longitude (λ) and obliquity (ε)
    const L = this.deg2rad((280.460 + 0.9856474 * n) % 360);
    const g = this.deg2rad((357.528 + 0.9856003 * n) % 360);
    const lambda = this.normalizeRad(
      L + this.deg2rad(1.915) * Math.sin(g) + this.deg2rad(0.020) * Math.sin(2 * g)
    );
    const epsilon = this.deg2rad(23.439 - 0.0000004 * n);

    // Right ascension (α) and declination (δ)
    const sinλ = Math.sin(lambda), cosλ = Math.cos(lambda);
    const sinε = Math.sin(epsilon), cosε = Math.cos(epsilon);
    const alpha = Math.atan2(cosε * sinλ, cosλ);
    const delta = Math.asin(sinε * sinλ);

    // Greenwich Mean Sidereal Time (GMST)
    const theta = this.normalizeRad(
      this.deg2rad(280.46061837) + this.deg2rad(360.98564736629) * (JD - 2451545.0)
    );

    // Greenwich Hour Angle and subsolar lon/lat (east-positive lon)
    const GHA = this.normalizeRad(theta - alpha);
    const lon = this.normalizeRad(-GHA);
    const lat = delta;

    return { lat, lon, gmst: theta };
  }

  updateSunPosition() {
    // Real-time Sun: place directional light toward the current subsolar point
    if (!this.sunLight || !this.earthGroup) return;

    const now = new Date();
    const { lat, lon } = this.computeSubsolar(now);

    // Vector from Earth's center toward subsolar point, in Earth-fixed frame
    const dirECEF = this.lonLatToUnit(lon, lat);

    // Convert to world space using Earth's current orientation
    const worldDir = dirECEF.clone().applyQuaternion(this.earthGroup.quaternion).normalize();

    const distance = 1000; // far for stable shadows
    this.sunLight.position.copy(this.earthGroup.position).addScaledVector(worldDir, distance);
    this.sunLight.target.position.copy(this.earthGroup.position);
    this.sunLight.target.updateMatrixWorld();
  }

  setupEventListeners() {
    // Window resize - with better error handling
    window.addEventListener('resize', this.boundHandleResize);
    
    // Button functionality - remove any existing listener first to prevent duplicates
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn && this.onGetStartedClick) {
      // Remove existing listener if any
      getStartedBtn.removeEventListener('click', this.onGetStartedClick);
      // Add new listener
      getStartedBtn.addEventListener('click', this.onGetStartedClick);
    }
  }

  handleResize() {
    // Check if scene is fully initialized before handling resize
    if (!this.isInitialized || !this.camera || !this.renderer) {
      return;
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Update Earth and cloud sizes on resize
    this.updateEarthSize();
  }

  updateEarthSize() {
    // Get new responsive sizes
    const newEarthRadius = Utils.getResponsiveEarthRadius();
    const newCloudRadius = Utils.getResponsiveCloudRadius();
    const newSegments = Utils.getResponsiveSegments();
    
    // Update Earth geometry
    if (this.earthMesh) {
      const earthGeometry = new THREE.SphereGeometry(newEarthRadius, newSegments, newSegments);
      this.earthMesh.geometry.dispose(); // Clean up old geometry
      this.earthMesh.geometry = earthGeometry;
    }
    
    // Update Cloud geometry
    if (this.cloudMesh) {
      const cloudGeometry = new THREE.SphereGeometry(newCloudRadius, newSegments, newSegments);
      this.cloudMesh.geometry.dispose(); // Clean up old geometry
      this.cloudMesh.geometry = cloudGeometry;
    }
    
    // Update UI elements
    Utils.updateButtonStyles();
    Utils.updateLogoStyles();
    
    // Recalculate positions if in shifted mode
    if (this.isShifted) {
      const earthPos = PositionCalculator.getEarthPosition(this.camera);
      
      this.targetEarthPosition.x = earthPos.x;
      this.targetEarthPosition.y = earthPos.y;
      
      // Update legacy properties for compatibility
      this.targetX = earthPos.x;
      this.targetY = earthPos.y;
      
      // Text position will automatically follow Earth, no need to recalculate
      // since it's computed in real-time during update()
    }
  }

  shiftToPresentation() {
    // Guard: prevent multiple calls in quick succession
    if (this.isShifted) return;
    
    // Debug: check current scene objects before cleanup
    this.debugSceneObjects();
    
    // Clean up any potential duplicates before shifting
    this.cleanupDuplicates();
    
    // Debug: check scene objects after cleanup
    this.debugSceneObjects();
    
    // Switch to presentation view
    this.camera.position.set(0, 0, CONFIG.CAMERA.INITIAL_Z);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    
    // Calculate positions based on screen orientation
    const earthPos = PositionCalculator.getEarthPosition(this.camera);
    
    // Set current Earth position to start animation from current location
    this.earthPosition.x = this.earthGroup.position.x;
    this.earthPosition.y = this.earthGroup.position.y;
    
    // Set target positions for smooth animation
    this.targetEarthPosition.x = earthPos.x;
    this.targetEarthPosition.y = earthPos.y;
    this.currentOrientation = earthPos.isPortrait ? 'portrait' : 'landscape';
    
    // Enable Earth following after a slight delay for smooth transition
    setTimeout(() => {
    }, 100);
    
    // Update legacy properties for compatibility
    this.targetX = earthPos.x;
    this.targetY = earthPos.y;
    
  // Update sun position to match new Earth position
  this.updateSunPosition();
  document.body.classList.add('shifted');
  this.controls.enabled = false;
  this.isShifted = true;
    
    // Immediately update logo position to start following Earth
    Utils.updateLogoPosition(this);
    
    // Force logo position updates during the shift animation (removed because we now have smooth interpolation)
    // The smooth interpolation in updateLogoPosition will handle the animation naturally
    
    // Reset interaction state when entering shifted mode
    this.isUserInteracting = false;
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
  }

  // Immediate shift to presentation without animation (for page refresh scenarios)
  setToPresentationMode() {
    if (this.isShifted) return;
    
    // Clean up any potential duplicates
    this.cleanupDuplicates();
    
    // Calculate positions for shifted state
    const earthPos = PositionCalculator.calculateEarthShiftedPosition();
    const textPos = PositionCalculator.calculateTextShiftedPosition();
    
    // Set Earth position immediately without animation
    if (this.earthGroup) {
      this.earthGroup.position.x = earthPos.x;
      this.earthGroup.position.y = earthPos.y;
    }
    
    // Update internal state
    this.earthPosition = new Position(earthPos.x, earthPos.y);
    this.targetEarthPosition = new Position(earthPos.x, earthPos.y);
    this.currentOrientation = earthPos.isPortrait ? 'portrait' : 'landscape';
    
    // Update legacy properties
    this.targetX = earthPos.x;
    this.targetY = earthPos.y;
    this.targetTextLeft = CONFIG.ANIMATION.TEXT_SHIFT_PERCENT;
    
    // Set shifted state
    document.body.classList.add('shifted');
    this.controls.enabled = false;
    this.isShifted = true;
    this.isUserInteracting = false;
    
    // Immediately update logo position for instant positioning
    Utils.updateLogoPosition(this);
    
    // Initialize logo position to current calculated position (avoids initial jump)
    const logoContainer = document.getElementById('planetkool-logo');
    if (logoContainer) {
      // Initialize smooth animation from wherever the logo currently is
      const currentLeft = parseFloat(logoContainer.style.left) || 50;
      const currentTop = parseFloat(logoContainer.style.top) || 50;
      this.logoPosition.x = currentLeft;
      this.logoPosition.y = currentTop;
    }
    
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
  }

  returnToCenter() {
    // Guard: prevent multiple calls in quick succession
    if (!this.isShifted) return;
    
    // Clean up any potential duplicates before returning
    this.cleanupDuplicates();
    
    // Return to center view
    // Set current positions to start smooth animation from current location
    this.earthPosition.x = this.earthGroup.position.x;
    this.earthPosition.y = this.earthGroup.position.y;
    
    this.targetEarthPosition.x = 0;
    this.targetEarthPosition.y = 0;
    
    // Reset interaction state when returning to center
    this.isUserInteracting = false;
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
    
    // Set target to center for smooth animation
    this.targetEarthPosition = new Position(0, 0);
    
    // Update legacy properties for compatibility
    this.targetX = 0;
    this.targetY = 0;
    this.targetTextX = '50%';
    this.targetTextY = '50%';
    this.targetTextLeft = CONFIG.ANIMATION.CENTER_PERCENT;
    
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.copy(this.defaultCameraTarget);
    this.controls.update();
    
    this.controls.enabled = true;
    document.body.classList.remove('shifted');
    this.isShifted = false;
    
    // Immediately update logo position to start following Earth back to center
    Utils.updateLogoPosition(this);
    
    // Force logo position updates during the return animation (removed because we now have smooth interpolation)
    // The smooth interpolation in updateLogoPosition will handle the return animation naturally
  }

  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }

  update() {
    // ✅ Keep the sun synced to real time each frame (minimal addition)
    this.updateSunPosition();

    // Animate Earth position
    this.earthPosition = this.animationManager.lerpPosition(
      this.earthPosition, 
      this.targetEarthPosition
    );
    this.earthGroup.position.x = this.earthPosition.x;
    this.earthGroup.position.y = this.earthPosition.y;

    // Rotation animations
    this.earthGroup.rotation.y += CONFIG.EARTH.GROUP_ROTATION_SPEED;
    this.earthMesh.rotation.y += CONFIG.EARTH.ROTATION_SPEED;
    this.cloudMesh.rotation.y += CONFIG.CLOUDS.ROTATION_SPEED;
    this.starMesh.rotation.y += CONFIG.STARS.ROTATION_SPEED_Y;
    this.starMesh.rotation.x += CONFIG.STARS.ROTATION_SPEED_X;
    
    // Always update logo position to follow Earth center (whether shifted or returning to center)
    Utils.updateLogoPosition(this);
    
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
