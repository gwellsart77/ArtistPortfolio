import { useState, useEffect, useCallback } from 'react';
import { applyArtworkColorPalette, removeColorPalette } from '@/lib/color-palette';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
}

interface UseArtworkThemeReturn {
  palette: ColorPalette | null;
  isLoading: boolean;
  error: string | null;
  applyTheme: (imageUrl: string, elementId?: string) => Promise<void>;
  removeTheme: (elementId?: string) => void;
}

export function useArtworkTheme(): UseArtworkThemeReturn {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTheme = useCallback(async (imageUrl: string, elementId?: string) => {
    if (!imageUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newPalette = await applyArtworkColorPalette(imageUrl, elementId);
      setPalette(newPalette);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply artwork theme';
      setError(errorMessage);
      console.warn('Artwork theme error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeTheme = useCallback((elementId?: string) => {
    removeColorPalette(elementId);
    setPalette(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeColorPalette();
    };
  }, []);

  return {
    palette,
    isLoading,
    error,
    applyTheme,
    removeTheme
  };
}