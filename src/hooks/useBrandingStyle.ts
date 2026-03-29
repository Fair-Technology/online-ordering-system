import { CSSProperties, useEffect, useMemo } from 'react';
import type { BrandColors } from '../utils/branding';

type ResolvedBranding = {
  colors: BrandColors;
  logoUrl: string;
  heroImageUrl: string;
};

/**
 * Applies shop branding colours as CSS custom properties on <html> and
 * returns an inline style object for the page wrapper element.
 *
 * We set properties on `document.documentElement` (the <html> element) rather
 * than the wrapper div because portal-rendered elements — the NavBar cart
 * dropdown and ProductModal — sit outside the wrapper in the DOM tree but
 * still need access to the brand colours via var(--brand-primary) etc.
 *
 * @param branding - Resolved branding object from resolveShopBranding()
 * @returns CSSProperties object to spread onto the page wrapper <div>
 */
export function useBrandingStyle(branding: ResolvedBranding): CSSProperties {
  const { primary, secondary, tertiary, background } = branding.colors;

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--brand-primary', primary);
    rootStyle.setProperty('--brand-secondary', secondary);
    rootStyle.setProperty('--brand-tertiary', tertiary);
    rootStyle.setProperty('--brand-background', background);
  }, [primary, secondary, tertiary, background]);

  return useMemo(
    () =>
      ({
        '--brand-primary': primary,
        '--brand-secondary': secondary,
        '--brand-tertiary': tertiary,
        '--brand-background': background,
      }) as CSSProperties,
    [primary, secondary, tertiary, background],
  );
}
