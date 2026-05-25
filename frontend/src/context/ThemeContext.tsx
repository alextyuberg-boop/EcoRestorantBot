import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api';

export type ThemeMode = 'dark' | 'light' | 'green';

export interface RestaurantTheme {
  mode: ThemeMode;
  primaryColor: string;
  restaurantName: string;
  deliveryFee: number;
  minOrder: number;
  isActive: boolean;
  logoUrl?: string;
}


interface ThemeContextType {
  theme: RestaurantTheme;
  setTheme: (t: RestaurantTheme) => void;
  tokens: ThemeTokens;
}

export interface ThemeTokens {
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgOverlay: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentText: string;
  accentBg: string;
  accentBgStrong: string;
  shadow: string;
  headerBg: string;
}

export const DARK_TOKENS: Omit<ThemeTokens, 'accent' | 'accentText' | 'accentBg' | 'accentBgStrong'> = {
  bg:            '#000000',
  bgCard:        '#09090A',
  bgElevated:    '#121213',
  bgOverlay:     'rgba(0,0,0,0.95)',
  text:          '#FFFFFF',
  textMuted:     '#AAAAAA',
  textFaint:     '#555555',
  border:        '#1E1E20',
  borderStrong:  '#2B2B2E',
  shadow:        '0 4px 24px rgba(0,0,0,0.8)',
  headerBg:      'rgba(0,0,0,0.88)',
};

export const LIGHT_TOKENS: Omit<ThemeTokens, 'accent' | 'accentText' | 'accentBg' | 'accentBgStrong'> = {
  bg:            '#F4F4F7',
  bgCard:        '#FFFFFF',
  bgElevated:    '#EBEBF0',
  bgOverlay:     'rgba(255,255,255,0.92)',
  text:          '#111111',
  textMuted:     '#555555',
  textFaint:     '#AAAAAA',
  border:        '#E0E0E8',
  borderStrong:  '#C8C8D8',
  shadow:        '0 4px 24px rgba(0,0,0,0.08)',
  headerBg:      'rgba(255,255,255,0.90)',
};

export const GREEN_TOKENS: Omit<ThemeTokens, 'accent' | 'accentText' | 'accentBg' | 'accentBgStrong'> = {
  bg:            '#041A0B',
  bgCard:        '#082C15',
  bgElevated:    '#114C26',
  bgOverlay:     'rgba(4,26,11,0.95)',
  text:          '#E8F8EE',
  textMuted:     '#8FCFA7',
  textFaint:     '#4A7D5C',
  border:        '#164C28',
  borderStrong:  '#226C3C',
  shadow:        '0 4px 24px rgba(4,26,11,0.6)',
  headerBg:      'rgba(8,44,21,0.9)',
};

function buildTokens(mode: ThemeMode, primaryColor: string): ThemeTokens {
  let base;
  if (mode === 'light') {
    base = LIGHT_TOKENS;
  } else if (mode === 'green') {
    base = GREEN_TOKENS;
  } else {
    base = DARK_TOKENS;
  }
  return {
    ...base,
    accent:           primaryColor,
    accentText:       '#000000',
    accentBg:         `${primaryColor}18`,
    accentBgStrong:   `${primaryColor}30`,
  };
}

const defaultTheme: RestaurantTheme = {
  mode: 'dark',
  primaryColor: '#00E561',
  restaurantName: 'EcoRestaurant',
  deliveryFee: 0,
  minOrder: 0,
  isActive: true,
  logoUrl: '',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
  tokens: buildTokens('dark', '#00E561'),
});

export function ThemeProvider({
  children,
  restaurantId,
}: {
  children: ReactNode;
  restaurantId: number;
}) {
  const [theme, setTheme] = useState<RestaurantTheme>(defaultTheme);
  const [tokens, setTokens] = useState<ThemeTokens>(buildTokens('dark', '#00E561'));

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/menu/restaurant/${restaurantId}/settings`);
        const resolved: RestaurantTheme = {
          mode:           (data.theme === 'light' ? 'light' : data.theme === 'green' ? 'green' : 'dark') as ThemeMode,
          primaryColor:   data.primary_color || '#00E561',
          restaurantName: data.name || 'EcoRestaurant',
          deliveryFee:    data.delivery_fee || 0,
          minOrder:       data.min_order || 0,
          isActive:       data.is_active ?? true,
          logoUrl:        data.logo_url || '',
        };
        setTheme(resolved);
        setTokens(buildTokens(resolved.mode, resolved.primaryColor));
      } catch {
        // keep defaults
      }
    })();
  }, [restaurantId]);

  const handleSetTheme = (t: RestaurantTheme) => {
    setTheme(t);
    setTokens(buildTokens(t.mode, t.primaryColor));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
