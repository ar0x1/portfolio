import { EDITORIAL_IMAGE } from '../data/content';

/** Public asset path that respects Vite's `base`. */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;

/**
 * Everything the first two screens can paint before the visitor scrolls.
 *
 * The 3D stage and the fonts are tracked by `App.tsx` itself; this list is the
 * *images*, i.e. the things that would otherwise pop in mid-interaction. The
 * lanyard card's art left with the card, so the plate is what remains.
 */
export const SITE_ASSETS: string[] = [EDITORIAL_IMAGE];

/** The faces the first two screens set type in. */
export const SITE_FONTS = [
  '16px Italiana',
  '300 16px Outfit',
  '600 16px Outfit',
  'italic 500 16px "Playfair Display"',
  '400 44px "Press Start 2P"'
];

/**
 * Decodes every url and reports `(loaded, total)` as they land. Never rejects:
 * a missing asset must not trap the visitor behind a loader, so an error counts
 * as "loaded" — the screen behind it has its own fallbacks.
 */
export function preloadImages(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const total = urls.length;
  let loaded = 0;

  const settle = () => {
    loaded += 1;
    onProgress?.(loaded, total);
  };

  return Promise.all(
    urls.map(
      url =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            settle();
            resolve();
          };
          img.onerror = () => {
            settle();
            resolve();
          };
          img.src = url;
        })
    )
  ).then(() => undefined);
}

/** Resolves once the faces are usable; never rejects. */
export function preloadFonts(fonts: string[] = SITE_FONTS): Promise<void> {
  try {
    const set = document.fonts;
    if (!set) return Promise.resolve();
    return Promise.all(fonts.map(f => set.load(f).catch(() => null))).then(() => undefined);
  } catch {
    return Promise.resolve();
  }
}
