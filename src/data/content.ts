/**
 * SINGLE SOURCE OF TRUTH FOR ALL SITE CONTENT.
 * Change your name, copy, links and assets here — no component edits needed.
 * The text below is the original Laocoön copy, kept verbatim until you swap it.
 */

export interface ProjectCard {
  index: string;
  title: string;
  tag: string;
  year: string;
  href: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface SlideContent {
  id: string;
  title: string;          // "\n" renders as a <br />
  paragraphs: string[];
  variant?: 'split';     // two description columns
}

export const site = {
  title: 'The Statue of Laocoön',
  description: 'A cinematic, scroll-driven bronze sculpture experience.',
  brand: "Laocoön",
  editorialImage: "https://api.getlayers.ai/storage/v1/object/public/public/assets/laocoon-59f84455c6/1.png",
  editorialImageAlt: 'Editorial Concept',
  nav: [
    { label: "Bronze", href: "#slide-1" },
    { label: "Marble", href: "#slide-2" },
    { label: "Fluid", href: "#slide-3" },
    { label: "Digital", href: "#slide-4" },
  ],
  contact: { label: 'Contact', href: '#' },
  /** Shown in the work interlude (scroll 0.42 -> 0.55). Replace with your real projects. */
  projects: [
    { index: '01', title: 'Form Study', tag: 'Sculpture · 3D', year: '2025', href: '#' },
    { index: '02', title: 'Patina Series', tag: 'Material · Shader', year: '2024', href: '#' },
    { index: '03', title: 'Molten Archive', tag: 'Web · WebGL', year: '2024', href: '#' },
  ] as ProjectCard[],
  /** Count-up stats in the same interlude. */
  stats: [
    { value: 12, suffix: '+', label: 'Projects shipped' },
    { value: 6, suffix: '', label: 'Years in craft' },
    { value: 40, suffix: 'k', label: 'Visitors reached' },
  ] as StatItem[],
  /** Words in the velocity-reactive marquee (scroll 0.70 -> 0.83). */
  marquee: ['Bronze', 'Patina', 'Time', 'Form', 'Light', 'Matter'],
  slides: [
  {
    id: "slide-1",
    // Slides.tsx renders the hero line with the animated StrokeText component
    // (components/HeroStrokeTitle.tsx), so this title is no longer painted. It is
    // kept as the plain-text fallback / SEO string.
    title: "Hi..! I'm\nAryan Kumar",
    // The hero slide carries only the animated "Hi..! I'm Aryan Kumar" headline,
    // so it ships no body copy (the old bronze paragraphs are gone).
    paragraphs: [],
    variant: 'split'
  },
  {
    id: "slide-2",
    title: "Marble\nEmotion",
    paragraphs: ["A sculpture frozen at the peak of human suffering and heroic struggle. Laocoön and his sons, bound by ruthless fate."]
  },
  {
    id: "slide-3",
    title: "Liquid Metal",
    paragraphs: ["Art that breathes. Mesmerizing waves of liquid bronze flow through space, reflecting every contour and tensed muscle of the ancient masterpiece."]
  },
  {
    id: "slide-4",
    title: "Eternal\nMoment",
    paragraphs: ["Contemplating antique form through the lens of new dimensions. A classic masterpiece reborn in the currents of radiant digital matter."]
  }
  ] as SlideContent[],
};

/** Relative paths get Vite's BASE_URL so the build works on sub-path deploys. */
const withBase = (path: string): string =>
  /^(https?:|data:|blob:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const EDITORIAL_IMAGE = withBase(import.meta.env.VITE_EDITORIAL_IMAGE || site.editorialImage);
