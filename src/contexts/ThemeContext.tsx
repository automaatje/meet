import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from './OrganizationContext';
import { applyTheme, type Theme } from '../lib/branding/theme-generator';

interface BrandingTheme {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  colors: Theme['colors'];
  logo_url: string | null;
  favicon_url: string | null;
  fonts: Theme['fonts'];
  custom_css: string | null;
}

interface ThemeContextType {
  theme: BrandingTheme | null;
  loading: boolean;
  refreshTheme: () => Promise<void>;
  updateFavicon: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const [theme, setTheme] = useState<BrandingTheme | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTheme = async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('branding_themes')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTheme(data);
        applyTheme({
          colors: data.colors,
          fonts: data.fonts,
          custom_css: data.custom_css || undefined,
        });

        if (data.logo_url) {
          updateLogo(data.logo_url);
        }

        if (data.favicon_url) {
          updateFavicon(data.favicon_url);
        }
      } else {
        // No active theme - apply defaults explicitly
        setTheme(null);
        applyTheme({
          colors: {
            primary: '#2563EB',
            secondary: '#10B981',
            accent: '#F59E0B',
            background: '#FFFFFF',
            text: '#1F2937',
          },
          fonts: {
            family: 'Inter',
            baseSize: 16,
          },
        });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, [organization]);

  const updateLogo = (url: string) => {
    const logoElements = document.querySelectorAll('[data-brand-logo]');
    logoElements.forEach((element) => {
      if (element instanceof HTMLImageElement) {
        element.src = url;
      }
    });
  };

  const updateFavicon = (url: string | null) => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && url) {
      favicon.href = url;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        loading,
        refreshTheme: loadTheme,
        updateFavicon,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
