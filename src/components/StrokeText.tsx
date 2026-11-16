// @ts-nocheck
/**
 * react-bits `StrokeText` (JS + CSS) — vendored verbatim from the user's shadcn
 * drop (`@react-bits/StrokeText-JS-CSS`), with only the CSS import path adjusted.
 *
 * Draws the text as an SVG stroke (dash-offset animation) and then wipes the fill
 * in. `fontFamily="inherit"` is NOT used here: the caller passes the site's
 * display serif explicitly so the headline keeps the portfolio's typography.
 *
 * Requires `gsap` + `gsap/ScrollTrigger`.
 */
'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import '../styles/stroke-text.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_TEXT = 'Draw Attention';
const SHADOW_OPACITY = 0.5;

const getWipeFrames = (box, wipeFrom) => {
  const end = { x: box.x, y: box.y, width: box.width, height: box.height };
  if (wipeFrom === 'right') return { start: { ...end, x: box.x + box.width, width: 0 }, end };
  if (wipeFrom === 'top') return { start: { ...end, height: 0 }, end };
  if (wipeFrom === 'bottom') return { start: { ...end, y: box.y + box.height, height: 0 }, end };
  return { start: { ...end, width: 0 }, end };
};

const getDashPattern = (strokeStyle, dashLength, strokeWidth) => {
  const width = Math.max(Number(strokeWidth) || 0, 0.1);
  const length = Math.max(Number(dashLength) || 0, 1);
  if (strokeStyle === 'dotted') {
    const gap = Math.max(length, width * 1.8);
    return { array: `0 ${gap}`, period: gap };
  }
  if (strokeStyle === 'dashed') {
    const on = Math.max(length - width, 0.5);
    const off = length * 0.6 + width;
    return { array: `${on} ${off}`, period: on + off };
  }
  return null;
};

const StrokeText = ({
  text = DEFAULT_TEXT,
  strokeColor = '#ffffff',
  fillColor = 'currentColor',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'wipe',
  wipeFrom = 'left',
  fontSize = 128,
  fontWeight = 800,
  fontFamily = 'inherit',
  letterSpacing = -4,
  reverse = false,
  strokeStyle = 'solid',
  dashLength = 10,
  marching = false,
  hoverRedraw = false,
  shadow = false,
  shadowColor,
  // LOCAL ADDITION — a moving gradient INSIDE the outline, so the reveal (stroke
  // draw + fill wipe) and the gradient shimmer play together. `background-clip:
  // text` cannot clip SVG glyphs, so the gradient is expressed natively in the SVG.
  gradientColors = null as string[] | null,
  gradientSpeed = 8,
  gradientAngle = 90,
  // LOCAL ADDITION — the react-bits ShinyText gloss band, swept over the glyphs as
  // a third layer (reveal + gradient + shine). Same reason as the gradient: the
  // vendored CSS clips HTML text only, so the band is an SVG paint server here.
  shineColor = null as string | null,
  shineSpeed = 2,
  shineWidth = 40,
  shineSoftness = 0.8,
  shineBands = 1,
  shineAngle = 120,
  shineDirection = 'left' as 'left' | 'right',
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const strokeTextRef = useRef(null);
  const wipeRectRef = useRef(null);
  const shadowRef = useRef(null);

  const [box, setBox] = useState(null);

  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const wipeId = `stroke-text-wipe-${baseId}`;
  const revealId = `stroke-text-reveal-${baseId}`;
  const erodeId = `stroke-text-erode-${baseId}`;
  const shadowId = `stroke-text-shadow-${baseId}`;
  const gradientId = `stroke-text-gradient-${baseId}`;
  const shineId = `stroke-text-shine-${baseId}`;

  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);

  const dash = Math.max(fontSize * 7, 200);
  const pattern = getDashPattern(strokeStyle, dashLength, strokeWidth);
  const dashArray = pattern ? pattern.array : null;
  const dashPeriod = pattern ? pattern.period : 0;
  const lift = fontSize * 0.06;
  const softness = fontSize * 0.016;
  const castShadow = shadow && fillMode !== 'none';

  const fontStyle = useMemo(
    () => ({
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`
    }),
    [fontFamily, fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !strokeTextRef.current) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next
      );
    };

    measure();
    document.fonts?.ready?.then(measure).catch(() => {});

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [characters, fontFamily, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    const outline = strokeTextRef.current;
    const drop = shadowRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig = reverse ? { each: stagger, from: 'end' } : stagger;
    const frames = getWipeFrames(box, wipeFrom);
    const lifted = { dx: lift, dy: lift, 'flood-opacity': SHADOW_OPACITY };
    const grounded = { dx: 0, dy: 0, 'flood-opacity': 0 };
    const targets = [...strokes, ...fills, wipe, drop].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash, strokeOpacity: 1 });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: frames.start });
      if (drop) gsap.set(drop, { attr: grounded });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0, strokeOpacity: 1 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: fillEnabled ? frames.end : frames.start });
      if (drop) gsap.set(drop, { attr: fillEnabled ? lifted : grounded });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => gsap.killTweensOf(targets);
    }

    const build = () => {
      setStart();
      const looping = trigger === 'loop';
      const tl = gsap.timeline({
        paused: true,
        repeat: looping ? -1 : 0,
        repeatDelay: looping ? 0.9 : 0,
        yoyo: looping,
        defaults: { overwrite: 'auto' }
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);

      if (useWipe && wipe) {
        tl.to(wipe, { attr: frames.end, duration: fillDuration, ease: 'power2.inOut' }, drawDuration + fillDelay);
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          drawDuration + fillDelay
        );
      }

      if (drop && fillEnabled) {
        tl.to(
          drop,
          { attr: lifted, duration: fillDuration * 1.4, ease: 'power3.out' },
          drawDuration + fillDelay + fillDuration * 0.3
        );
      }

      return tl;
    };

    let timeline = null;
    let scrollTrigger = null;
    let redraw = null;
    const listeners = [];

    const listen = handler => {
      root.addEventListener('pointerenter', handler);
      listeners.push(handler);
    };

    if (trigger === 'hover') {
      setEnd();
      listen(() => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      });
    } else {
      timeline = build();
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => timeline?.play(0)
        });
      } else {
        timeline.play(0);
      }

      if (hoverRedraw && trigger !== 'loop') {
        listen(() => {
          if (!timeline || timeline.progress() < 1 || redraw?.isActive()) return;
          redraw?.kill();
          redraw = gsap
            .timeline()
            .to(strokes, { strokeOpacity: 0, duration: 0.2, ease: 'power1.out' })
            .set(strokes, { strokeDashoffset: dash, strokeOpacity: 1 })
            .to(strokes, { strokeDashoffset: 0, duration: drawDuration * 0.8, ease, stagger: staggerConfig });
        });
      }
    }

    const march =
      dashArray && marching && outline
        ? gsap.fromTo(
            outline,
            { strokeDashoffset: 0 },
            { strokeDashoffset: -dashPeriod, duration: dashPeriod / (fontSize * 0.22), ease: 'none', repeat: -1 }
          )
        : null;

    return () => {
      listeners.forEach(handler => root.removeEventListener('pointerenter', handler));
      scrollTrigger?.kill();
      timeline?.kill();
      redraw?.kill();
      march?.kill();
      gsap.killTweensOf(targets);
    };
  }, [
    box,
    dash,
    drawDuration,
    fillDelay,
    stagger,
    ease,
    trigger,
    fillMode,
    wipeFrom,
    reverse,
    dashArray,
    dashPeriod,
    marching,
    hoverRedraw,
    castShadow,
    lift,
    fontSize
  ]);

  // --- LOCAL ADDITION: the fill gradient -------------------------------------
  // Same maths as the react-bits GradientText `linear` variant: the palette is
  // closed into a loop (last stop repeats the first) so one translate of exactly
  // one period scrolls seamlessly. `gradientAngle` follows the CSS convention
  // (90deg = left-to-right), mapped into SVG user space where y grows downwards.
  const gradientStops = gradientColors && gradientColors.length ? [...gradientColors, gradientColors[0]] : null;
  const angleRad = (Math.max(0, Math.min(360, Number(gradientAngle) || 90)) * Math.PI) / 180;
  const dirX = Math.sin(angleRad);
  const dirY = -Math.cos(angleRad);
  const span = box ? Math.abs(dirX) * box.width + Math.abs(dirY) * box.height : fontSize * 8;
  const gradient = gradientStops
    ? {
        x1: box ? box.x : 0,
        y1: box ? box.y : 0,
        x2: (box ? box.x : 0) + dirX * span,
        y2: (box ? box.y : 0) + dirY * span,
        tx: dirX * span,
        ty: dirY * span
      }
    : null;
  const fillPaint = gradient ? `url(#${gradientId})` : fillColor;

  // --- LOCAL ADDITION: the ShinyText gloss band -------------------------------
  // Same construction as the vendored component: a soft-edged band whose profile
  // comes from its FALLOFF samples, `softness` shrinking the solid core, extra
  // `bands` sitting behind the first at 1.3x spacing with reduced strength. The
  // sweep itself is one translate of exactly one span, so it loops seamlessly.
  const shineHalf = Math.max(2, Math.min(200, Number(shineWidth) || 40)) / 2;
  const shineCore = shineHalf * (1 - Math.max(0, Math.min(1, Number(shineSoftness) || 0)));
  const shineFade = shineHalf - shineCore;
  const shineCount = Math.max(1, Math.min(3, Math.round(Number(shineBands) || 1)));
  const shineSign = shineDirection === 'right' ? 1 : -1;
  const shineStops = shineColor
    ? (() => {
        const list = [];
        for (let band = 0; band < shineCount; band += 1) {
          const center = 50 - shineSign * band * shineHalf * 2 * 1.3;
          const strength = 1 - band * 0.28;
          for (const side of [-1, 1]) {
            for (const f of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
              list.push([
                center + side * ((shineCore + shineFade * (1 - f)) * (100 / (2 * shineHalf))),
                f * f * (3 - 2 * f) * strength
              ]);
            }
          }
        }
        return list.sort((a, b) => a[0] - b[0]);
      })()
    : null;
  const shine =
    shineStops && box
      ? {
          x1: box.x,
          y1: box.y,
          x2: box.x + dirX * span,
          y2: box.y + dirY * span,
          from: `${-dirX * span * 1.6} ${-dirY * span * 1.6}`,
          to: `${dirX * span * 1.6} ${dirY * span * 1.6}`
        }
      : null;

  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} 600 ${fontSize * 1.3}`;
  const wipeStart = box ? getWipeFrames(box, wipeFrom).start : null;
  const region = box
    ? { x: box.x - fontSize, y: box.y - fontSize, width: box.width + fontSize * 2, height: box.height + fontSize * 2 }
    : {};

  const outlineLayer = (
    <text
      key={dashArray ? 'pattern' : 'solid'}
      ref={strokeTextRef}
      className="stroke-text__stroke"
      x="0"
      y="0"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashArray || undefined}
      mask={dashArray ? `url(#${revealId})` : undefined}
      style={fontStyle}
    >
      {characters.map((char, index) => (
        <tspan data-stroke-char={dashArray ? undefined : true} key={`s-${index}`}>
          {char}
        </tspan>
      ))}
    </text>
  );

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${trigger === 'hover' ? 'stroke-text--hover' : ''} ${className}`.trim()}
      style={{ ...style, '--stroke-text-width': `${box ? box.width : 600}px` }}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg
        className="stroke-text__svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={box ? undefined : { visibility: 'hidden' }}
      >
        <defs>
          {gradient && (
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={gradient.x1}
              y1={gradient.y1}
              x2={gradient.x2}
              y2={gradient.y2}
              spreadMethod="repeat"
            >
              {gradientStops.map((color, index) => (
                <stop
                  key={`stop-${index}`}
                  offset={`${(index / (gradientStops.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0 0"
                to={`${gradient.tx} ${gradient.ty}`}
                dur={`${Math.max(0.2, Number(gradientSpeed) || 8)}s`}
                repeatCount="indefinite"
              />
            </linearGradient>
          )}

          {shine && (
            <linearGradient
              id={shineId}
              gradientUnits="userSpaceOnUse"
              x1={shine.x1}
              y1={shine.y1}
              x2={shine.x2}
              y2={shine.y2}
              spreadMethod="pad"
            >
              <stop key="shine-0" offset="0%" stopColor={shineColor} stopOpacity={0} />
              {shineStops.map(([at, amount], index) => (
                <stop
                  key={`shine-stop-${index}`}
                  offset={`${Math.max(0, Math.min(100, at)).toFixed(2)}%`}
                  stopColor={shineColor}
                  stopOpacity={Math.max(0, Math.min(1, amount)).toFixed(3)}
                />
              ))}
              <stop key="shine-last" offset="100%" stopColor={shineColor} stopOpacity={0} />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values={`${shine.from};${shine.to}`}
                keyTimes="0;1"
                calcMode="spline"
                keySplines="0.42 0 0.58 1"
                dur={`${Math.max(0.1, Number(shineSpeed) || 2)}s`}
                repeatCount="indefinite"
              />
            </linearGradient>
          )}

          {fillMode === 'wipe' && wipeStart && (
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect
                ref={wipeRectRef}
                x={wipeStart.x}
                y={wipeStart.y}
                width={wipeStart.width}
                height={wipeStart.height}
              />
            </clipPath>
          )}

          {dashArray && (
            <filter id={erodeId} filterUnits="userSpaceOnUse" {...region}>
              <feMorphology operator="erode" radius={(Number(strokeWidth) || 1) / 2 + 0.75} />
            </filter>
          )}

          {dashArray && (
            <mask id={revealId} maskUnits="userSpaceOnUse" {...region}>
              <text
                x="0"
                y="0"
                fill="none"
                stroke="#fff"
                strokeWidth={(Number(strokeWidth) || 1) + 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={fontStyle}
              >
                {characters.map((char, index) => (
                  <tspan data-stroke-char key={`m-${index}`}>
                    {char}
                  </tspan>
                ))}
              </text>
              <text x="0" y="0" fill="#000" stroke="none" filter={`url(#${erodeId})`} style={fontStyle}>
                {characters.map((char, index) => (
                  <tspan key={`e-${index}`}>{char}</tspan>
                ))}
              </text>
            </mask>
          )}

          {castShadow && (
            <filter id={shadowId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" {...region}>
              <feDropShadow
                ref={shadowRef}
                dx={lift}
                dy={lift}
                stdDeviation={softness}
                floodColor={shadowColor || strokeColor}
                floodOpacity={SHADOW_OPACITY}
              />
            </filter>
          )}
        </defs>

        {!dashArray && outlineLayer}

        <g filter={castShadow ? `url(#${shadowId})` : undefined}>
          <text
            className="stroke-text__fill"
            x="0"
            y="0"
            fill={fillPaint}
            stroke="none"
            style={fontStyle}
            clipPath={fillMode === 'wipe' && wipeStart ? `url(#${wipeId})` : undefined}
          >
            {characters.map((char, index) => (
              <tspan data-fill-char key={`f-${index}`}>
                {char}
              </tspan>
            ))}
          </text>
        </g>

        {fillMode !== 'none' && shine && (
          <text
            className="stroke-text__shine"
            x="0"
            y="0"
            fill={`url(#${shineId})`}
            stroke="none"
            style={{ ...fontStyle, mixBlendMode: 'screen' }}
            clipPath={fillMode === 'wipe' && wipeStart ? `url(#${wipeId})` : undefined}
          >
            {characters.map((char, index) => (
              <tspan key={`sh-${index}`}>{char}</tspan>
            ))}
          </text>
        )}

        {dashArray && outlineLayer}
      </svg>
    </span>
  );
};

export default StrokeText;
