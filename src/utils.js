// Utility Functions

// Helper function to darken a hex color
export function darkenColor(hexColor, factor) {
  if (!hexColor) return '#0000ff';
  
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return '#0000ff';
  
  try {
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    const darkR = Math.floor(r * (1 - factor));
    const darkG = Math.floor(g * (1 - factor));
    const darkB = Math.floor(b * (1 - factor));
    
    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#0000ff';
  }
}

// Helper function to lighten a hex color
export function lightenColor(hexColor, factor) {
  if (!hexColor) return '#0000ff';
  
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return '#0000ff';
  
  try {
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    const lightR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const lightG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const lightB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#0000ff';
  }
}

// Extract hue from hex color
export function getHueFromColor(hexColor) {
  if (!hexColor) return 240;
  
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return 240;
  
  try {
    const r = parseInt(hexColor.substr(0, 2), 16) / 255;
    const g = parseInt(hexColor.substr(2, 2), 16) / 255;
    const b = parseInt(hexColor.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    
    if (max !== min) {
      if (max === r) {
        hue = (g - b) / (max - min) * 60;
      } else if (max === g) {
        hue = (2 + (b - r) / (max - min)) * 60;
      } else {
        hue = (4 + (r - g) / (max - min)) * 60;
      }
      
      if (hue < 0) hue += 360;
    }
    
    return hue;
  } catch (e) {
    return 240;
  }
}

// Helper to check if an element is an input field
export function isInputElement(element) {
  if (!element) return false;
  const tagName = element.tagName;
  const type = element.type;
  return (
    tagName === 'INPUT' && (type === 'text' || type === 'number') ||
    tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

