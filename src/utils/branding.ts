import type { ShopResponse } from '../services/api';

export type BrandColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
};

export type ShopBranding = {
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  colors?: Partial<BrandColors> | null;
};

export type ShopWithBranding = ShopResponse & {
  branding?: ShopBranding | null;
};

export const DEFAULT_BRANDING = {
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
  heroImageUrl:
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80',
  colors: {
    primary: '#FF8C32',
    secondary: '#E67828',
    tertiary: '#FFC107',
    background: '#FFF8F0',
  } as BrandColors,
};

const isValidHexColor = (value?: string | null): value is string =>
  Boolean(value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value));

const normalizeColor = (
  value: string | null | undefined,
  fallback: string
): string => (isValidHexColor(value) ? value : fallback);

export const resolveBrandColors = (
  colors?: Partial<BrandColors> | null
): BrandColors => ({
  primary: normalizeColor(colors?.primary, DEFAULT_BRANDING.colors.primary),
  secondary: normalizeColor(colors?.secondary, DEFAULT_BRANDING.colors.secondary),
  tertiary: normalizeColor(colors?.tertiary, DEFAULT_BRANDING.colors.tertiary),
  background: normalizeColor(colors?.background, DEFAULT_BRANDING.colors.background),
});

export const resolveShopBranding = (branding?: ShopBranding | null) => ({
  logoUrl: branding?.logoUrl || DEFAULT_BRANDING.logoUrl,
  heroImageUrl: branding?.heroImageUrl || DEFAULT_BRANDING.heroImageUrl,
  colors: resolveBrandColors(branding?.colors),
});
