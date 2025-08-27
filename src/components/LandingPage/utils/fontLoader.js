import { CONFIG } from './config.js';

// === FONT LOADING SYSTEM === //
export const FontLoader = {
  async load() {
    try {
      const font = new FontFace('AbodeFont', `url(${CONFIG.URLS.FONT})`, {
        style: 'normal',
        weight: '300',
        display: 'swap'
      });
      
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
      
      this.applyToElements();
      return true;
    } catch (error) {
      this.useFallback();
      return false;
    }
  },

  applyToElements() {
    const labelsElement = document.getElementById('labels');
    if (labelsElement) {
      labelsElement.style.fontFamily = "'AbodeFont', 'Georgia', 'Times New Roman', serif";
      this.forceRepaint(labelsElement);
    }
  },

  forceRepaint(element) {
    element.style.display = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.display = 'block';
  },

  useFallback() {
    const labelsElement = document.getElementById('labels');
    if (labelsElement) {
      labelsElement.style.fontFamily = "'Georgia', 'Times New Roman', serif";
    }
  }
};
