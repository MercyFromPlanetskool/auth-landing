import { CONFIG } from './config.js';

// === ANIMATION MANAGER === //
export class AnimationManager {
  constructor(lerpFactor = CONFIG.ANIMATION.LERP_FACTOR) {
    this.lerpFactor = lerpFactor;
  }

  lerpPosition(current, target) {
    current.x += (target.x - current.x) * this.lerpFactor;
    current.y += (target.y - current.y) * this.lerpFactor;
    return current;
  }

  lerpValue(current, target) {
    return current + (target - current) * this.lerpFactor;
  }

  animateElement(element, currentPos, targetPos, property = 'position') {
    if (!element) return;

    const newPos = this.lerpPosition(currentPos.clone(), targetPos);
    
    if (property === 'position') {
      element.position.x = newPos.x;
      element.position.y = newPos.y;
    } else if (property === 'style') {
      const posStr = newPos.toPercentageString();
      element.style.left = posStr.x;
      element.style.top = posStr.y;
    }

    return newPos;
  }
}
