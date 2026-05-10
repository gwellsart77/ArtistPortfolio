// Dynamic Color Palette Selector Based on Artwork
// Analyzes artwork images and generates complementary color schemes

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Convert RGB to HSL for better color manipulation
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL back to RGB
function hslToRgb(h: number, s: number, l: number): RGBColor {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Extract dominant colors from an image using Canvas API
export async function extractColorsFromImage(imageUrl: string): Promise<RGBColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Resize image for faster processing
      const size = 150;
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      
      try {
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Sample colors from the image (every 4th pixel for performance)
        const colorMap = new Map<string, number>();
        
        for (let i = 0; i < data.length; i += 16) { // Skip pixels for performance
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          // Skip transparent and very dark/light pixels
          if (alpha < 128 || (r + g + b) < 50 || (r + g + b) > 700) continue;
          
          // Quantize colors to reduce noise
          const qR = Math.floor(r / 32) * 32;
          const qG = Math.floor(g / 32) * 32;
          const qB = Math.floor(b / 32) * 32;
          
          const colorKey = `${qR},${qG},${qB}`;
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Sort colors by frequency and return top colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([colorKey]) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            return { r, g, b };
          });
          
        resolve(sortedColors);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

// Generate a complementary color palette from dominant colors
export function generateColorPalette(dominantColors: RGBColor[]): ColorPalette {
  if (dominantColors.length === 0) {
    // Fallback to default palette
    return {
      primary: '#b8860b',
      secondary: '#8b7355',
      accent: '#d4af37',
      background: '#fafafa',
      text: '#2c2c2c',
      textSecondary: '#666666'
    };
  }

  // Find the most vibrant color for primary
  let primaryColor = dominantColors[0];
  let maxSaturation = 0;
  
  for (const color of dominantColors.slice(0, 4)) {
    const hsl = rgbToHsl(color.r, color.g, color.b);
    if (hsl.s > maxSaturation && hsl.l > 20 && hsl.l < 80) {
      maxSaturation = hsl.s;
      primaryColor = color;
    }
  }

  const primaryHsl = rgbToHsl(primaryColor.r, primaryColor.g, primaryColor.b);
  
  // Generate secondary color (complementary hue)
  const secondaryHsl = {
    h: (primaryHsl.h + 180) % 360,
    s: Math.max(30, primaryHsl.s * 0.7),
    l: Math.max(25, Math.min(75, primaryHsl.l * 0.8))
  };
  const secondaryRgb = hslToRgb(secondaryHsl.h, secondaryHsl.s, secondaryHsl.l);
  
  // Generate accent color (triadic)
  const accentHsl = {
    h: (primaryHsl.h + 120) % 360,
    s: Math.max(40, primaryHsl.s * 0.9),
    l: Math.max(35, Math.min(85, primaryHsl.l * 1.1))
  };
  const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);

  // Generate background (very light version of primary)
  const backgroundHsl = {
    h: primaryHsl.h,
    s: Math.min(20, primaryHsl.s * 0.3),
    l: 96
  };
  const backgroundRgb = hslToRgb(backgroundHsl.h, backgroundHsl.s, backgroundHsl.l);

  return {
    primary: `rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})`,
    secondary: `rgb(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b})`,
    accent: `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`,
    background: `rgb(${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b})`,
    text: primaryHsl.l > 50 ? '#2c2c2c' : '#f5f5f5',
    textSecondary: primaryHsl.l > 50 ? '#666666' : '#cccccc'
  };
}

// Apply color palette to the page
export function applyColorPalette(palette: ColorPalette, elementId?: string) {
  const targetElement = elementId ? document.getElementById(elementId) : document.documentElement;
  
  if (!targetElement) return;

  // Apply CSS custom properties
  const style = targetElement.style;
  style.setProperty('--artwork-primary', palette.primary);
  style.setProperty('--artwork-secondary', palette.secondary);
  style.setProperty('--artwork-accent', palette.accent);
  style.setProperty('--artwork-background', palette.background);
  style.setProperty('--artwork-text', palette.text);
  style.setProperty('--artwork-text-secondary', palette.textSecondary);
  
  // Add a class to enable artwork-based styling
  targetElement.classList.add('artwork-themed');
}

// Remove artwork-based theming
export function removeColorPalette(elementId?: string) {
  const targetElement = elementId ? document.getElementById(elementId) : document.documentElement;
  
  if (!targetElement) return;
  
  targetElement.classList.remove('artwork-themed');
  
  // Remove custom properties
  const style = targetElement.style;
  style.removeProperty('--artwork-primary');
  style.removeProperty('--artwork-secondary');
  style.removeProperty('--artwork-accent');
  style.removeProperty('--artwork-background');
  style.removeProperty('--artwork-text');
  style.removeProperty('--artwork-text-secondary');
}

// Main function to analyze artwork and apply palette
export async function applyArtworkColorPalette(imageUrl: string, elementId?: string): Promise<ColorPalette> {
  try {
    const dominantColors = await extractColorsFromImage(imageUrl);
    const palette = generateColorPalette(dominantColors);
    applyColorPalette(palette, elementId);
    return palette;
  } catch (error) {
    console.warn('Failed to extract colors from artwork:', error);
    // Apply default palette on error
    const defaultPalette = generateColorPalette([]);
    applyColorPalette(defaultPalette, elementId);
    return defaultPalette;
  }
}