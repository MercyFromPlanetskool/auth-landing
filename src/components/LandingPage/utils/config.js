// === CONFIGURATION CONSTANTS === //
export const CONFIG = {
  CAMERA: {
    FOV: 50,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_Z: 2
  },
  EARTH: {
    RADIUS: 0.4,
    SEGMENTS: 64,
    ROTATION_SPEED: 0.001,
    GROUP_ROTATION_SPEED: 0.001
  },
  CLOUDS: {
    RADIUS: 0.405,
    SEGMENTS: 64,
    ROTATION_SPEED: 0.0005,
    OPACITY: 0.4
  },
  STARS: {
    RADIUS: 100,
    SEGMENTS: 64,
    ROTATION_SPEED_Y: -0.0002,
    ROTATION_SPEED_X: 0.0001
  },
  ANIMATION: {
    LERP_FACTOR: 0.03,  // Slower for smoother transitions
    SHIFT_DISTANCE: -1.0,
    TEXT_SHIFT_PERCENT: 25,
    CENTER_PERCENT: 50
  },
  URLS: {
    FONT: 'https://cdn.jsdelivr.net/gh/mercy089/realEarth@main/font/Abode-Light.ttf',
    TEXTURES: {
      // Files placed in `public/` are served from the site root
      EARTH: '/world.jpg',
      BUMP: '/earthbump.jpg',
      NIGHT: '/8k_earth_nightmap.jpg',
      CLOUDS: '/Earth-clouds.png',
      STARS: '/HDR_multi_nebulae.jpg'
    }
  }
};
